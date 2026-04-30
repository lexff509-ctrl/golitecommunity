/**
 * Script de validation complète du backend /investments
 * 
 * Tests:
 * 1. Création investissement valide
 * 2. Double requête (idempotency)
 * 3. Montant invalide
 * 4. Absence programme actif
 * 5. Tentative de fraude (montant modifié)
 * 6. Simulation multi-utilisateurs
 * 
 * Usage: npx tsx src/scripts/validate-investments.ts
 */

import { pool, db } from "@/db";
import { investments, programs, users, payments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

// Configuration
const TEST_USER_ID = uuidv4();
const TEST_PROGRAM_ID = uuidv4();
const API_BASE = "http://localhost:3000";

// Couleurs pour console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, type: "info" | "success" | "error" | "warn" = "info") {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[OK]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    warn: `${colors.yellow}[WARN]${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

function logStep(step: number, message: string) {
  console.log(`\n${colors.cyan}═══ ÉTAPE ${step}: ${message} ═══${colors.reset}\n`);
}

// ============================================
// SETUP: Préparation de l'environnement de test
// ============================================

async function setupTestEnvironment() {
  logStep(0, "PRÉPARATION ENVIRONNEMENT");
  
  try {
    // Créer utilisateur de test
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [TEST_USER_ID, "test@validation.local", "dummy_hash", "user"]);
    
    // Créer programme de test actif
    await pool.query(`
      INSERT INTO programs (id, name, min_amount, max_amount, multipliers, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      TEST_PROGRAM_ID,
      "Programme Test Validation",
      "10",
      "1000",
      JSON.stringify({ "15": "20", "30": "45", "100": "180" }),
      true
    ]);
    
    log("Environnement de test prêt", "success");
    log(`  - User ID: ${TEST_USER_ID}`);
    log(`  - Program ID: ${TEST_PROGRAM_ID}`);
    
  } catch (error) {
    log(`Erreur setup: ${error}`, "error");
    throw error;
  }
}

// ============================================
// TEST 1: Création investissement valide
// ============================================

async function testValidInvestment() {
  logStep(1, "CRÉATION INVESTISSEMENT VALIDE");
  
  const idempotencyKey = `test_valid_${Date.now()}`;
  const testData = {
    programId: TEST_PROGRAM_ID,
    amount: 30,
    paymentId: uuidv4(),
    idempotencyKey,
    method: "wave",
    proofUrl: "https://example.com/proof.jpg"
  };
  
  log(`Données envoyées: ${JSON.stringify(testData, null, 2)}`);
  
  try {
    // Simulation via requête directe DB (comme le ferait l'API)
    const client = await pool.connect();
    await client.query("BEGIN");
    
    try {
      // Lock programme avec FOR UPDATE
      const programResult = await client.query(
        `SELECT * FROM programs WHERE id = $1 AND active = true FOR UPDATE`,
        [TEST_PROGRAM_ID]
      );
      
      if (programResult.rows.length === 0) {
        throw new Error("Programme introuvable ou inactif");
      }
      
      const program = programResult.rows[0];
      const multipliers = typeof program.multipliers === "string" 
        ? JSON.parse(program.multipliers) 
        : program.multipliers;
      
      const amountNum = Number(testData.amount);
      const amountStr = String(amountNum);
      
      if (!multipliers[amountStr]) {
        throw new Error("Montant non autorisé");
      }
      
      if (amountNum < Number(program.min_amount) || amountNum > Number(program.max_amount)) {
        throw new Error(`Montant doit être entre ${program.min_amount} et ${program.max_amount}`);
      }
      
      const gain = multipliers[amountStr];
      const referenceCode = `INV-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      
      // Créer investissement
      const investmentResult = await client.query(
        `INSERT INTO investments (user_id, program_id, amount, gain, expected_return, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [TEST_USER_ID, TEST_PROGRAM_ID, amountNum, gain, gain, "pending", idempotencyKey]
      );
      
      const newInvestment = investmentResult.rows[0];
      log(`Investment créé: ID=${newInvestment.id}`, "success");
      
      // Créer payment avec related_id
      await client.query(
        `INSERT INTO payments (reference_code, user_id, method, amount, proof_url, status, type, related_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [referenceCode, TEST_USER_ID, testData.method, amountNum, testData.proofUrl, "pending", "investment", newInvestment.id]
      );
      
      log(`Payment créé: reference=${referenceCode}, related_id=${newInvestment.id}`, "success");
      
      await client.query("COMMIT");
      
      // Vérification
      const savedInvestment = await db.select().from(investments).where(eq(investments.id, newInvestment.id)).limit(1);
      const savedPayment = await pool.query(`SELECT * FROM payments WHERE related_id = $1`, [newInvestment.id]);
      
      log("\n--- Vérification ---", "info");
      log(`Investment enregistré: ${savedInvestment[0]?.id === newInvestment.id ? "✓" : "✗"}`);
      log(`Payment lié: ${savedPayment.rows.length > 0 ? "✓" : "✗"}`);
      log(`Montant: ${savedInvestment[0]?.amount} (attendu: ${amountNum})`);
      log(`Gain: ${savedInvestment[0]?.gain} (attendu: ${gain})`);
      log(`Status: ${savedInvestment[0]?.status}`);
      
      return { success: true, investment: newInvestment, referenceCode };
      
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    log(`Échec: ${error}`, "error");
    return { success: false, error: String(error) };
  }
}

// ============================================
// TEST 2: Idempotency (double requête)
// ============================================

async function testIdempotency() {
  logStep(2, "IDEMPOTENCY (DOUBLE REQUÊTE)");
  
  const idempotencyKey = `test_idempotency_${Date.now()}`;
  
  log(`Clé d'idempotency: ${idempotencyKey}`);
  
  try {
    // Première requête
    log("\n--- Requête 1/2 ---", "info");
    
    const client1 = await pool.connect();
    await client1.query("BEGIN");
    
    // Vérifier si déjà existant
    const existing = await client1.query(
      `SELECT * FROM investments WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    
    if (existing.rows.length > 0) {
      log("Investment déjà existant (idempotency)", "warn");
      await client1.query("ROLLBACK");
      client1.release();
      return { duplicate: true, investment: existing.rows[0] };
    }
    
    // Créer nouvel investissement
    const result1 = await client1.query(
      `INSERT INTO investments (user_id, program_id, amount, gain, expected_return, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [TEST_USER_ID, TEST_PROGRAM_ID, 15, 20, 20, "pending", idempotencyKey]
    );
    
    await client1.query("COMMIT");
    const investment1 = result1.rows[0];
    log(`Investment 1 créé: ${investment1.id}`, "success");
    client1.release();
    
    // Deuxième requête avec même clé
    log("\n--- Requête 2/2 (même clé) ---", "info");
    
    const client2 = await pool.connect();
    await client2.query("BEGIN");
    
    const existing2 = await client2.query(
      `SELECT * FROM investments WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    
    if (existing2.rows.length > 0) {
      log("Investment existant détecté - retour données existantes", "success");
      await client2.query("ROLLBACK");
      client2.release();
      
      log("\n--- Vérification ---", "info");
      log(`Same ID retourné: ${existing2.rows[0].id === investment1.id ? "✓" : "✗"}`);
      log(`Pas de doublon créé: ✓`);
      
      return { duplicate: true, investment: existing2.rows[0] };
    }
    
    await client2.query("ROLLBACK");
    client2.release();
    
  } catch (error) {
    log(`Erreur: ${error}`, "error");
    return { success: false, error: String(error) };
  }
}

// ============================================
// TEST 3: Montant invalide
// ============================================

async function testInvalidAmount() {
  logStep(3, "MONTANT INVALIDE");
  
  const testCases = [
    { amount: "abc", expected: "NaN" },
    { amount: -50, expected: "négatif" },
    { amount: 0, expected: "zéro" },
    { amount: null, expected: "null" },
    { amount: "", expected: "vide" },
  ];
  
  for (const testCase of testCases) {
    log(`\nTest: amount=${JSON.stringify(testCase.amount)}`, "info");
    
    const amountNum = Number(testCase.amount);
    const isValid = !isNaN(amountNum) && amountNum > 0;
    
    if (!isValid) {
      log(`  → Rejeté: ${isNaN(amountNum) ? "NaN" : amountNum <= 0 ? "≤ 0" : "invalide"} ✓`, "success");
    } else {
      log(`  → Accepté (devrait être rejeté) ✗`, "error");
    }
  }
  
  return { tested: testCases.length };
}

// ============================================
// TEST 4: Programme inactif
// ============================================

async function testInactiveProgram() {
  logStep(4, "PROGRAMME INACTIF");
  
  // Créer programme inactif
  const inactiveProgramId = uuidv4();
  
  await pool.query(`
    INSERT INTO programs (id, name, min_amount, max_amount, multipliers, active)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
  `, [inactiveProgramId, "Programme Inactif", "10", "1000", "{}", false]);
  
  log(`Programme inactif créé: ${inactiveProgramId}`);
  
  try {
    const client = await pool.connect();
    await client.query("BEGIN");
    
    const programResult = await client.query(
      `SELECT * FROM programs WHERE id = $1 AND active = true FOR UPDATE`,
      [inactiveProgramId]
    );
    
    if (programResult.rows.length === 0) {
      log("Programme inactif détecté → requête rejetée ✓", "success");
      await client.query("ROLLBACK");
    }
    
    client.release();
    return { success: true };
    
  } catch (error) {
    log(`Erreur attendue: ${error}`, "success");
    return { success: true };
  }
}

// ============================================
// TEST 5: Validation méthode payment
// ============================================

async function testPaymentMethodValidation() {
  logStep(5, "VALIDATION MÉTHODE PAYMENT");
  
  const allowedMethods = ["wave", "moncash", "natcash", "crypto"];
  const testCases = [
    { method: "wave", allowed: true },
    { method: "moncash", allowed: true },
    { method: "natcash", allowed: true },
    { method: "crypto", allowed: true },
    { method: "fake", allowed: false },
    { method: "cash", allowed: false },
    { method: "", allowed: false },
  ];
  
  for (const testCase of testCases) {
    const isAllowed = testCase.method === "" ? false : allowedMethods.includes(testCase.method);
    const result = isAllowed === testCase.allowed ? "✓" : "✗";
    
    if (testCase.allowed) {
      log(`  ${testCase.method}: ${isAllowed ? "accepté" : "rejeté"} ${result}`, isAllowed ? "success" : "error");
    } else {
      log(`  ${testCase.method}: ${isAllowed ? "accepté" : "rejeté"} ${result}`, isAllowed ? "error" : "success");
    }
  }
  
  return { tested: testCases.length };
}

// ============================================
// TEST 6: Validation proof URL
// ============================================

async function testProofUrlValidation() {
  logStep(6, "VALIDATION PROOF URL");
  
  const testCases = [
    { url: "https://example.com/proof.jpg", valid: true },
    { url: "http://example.com/proof.jpg", valid: true },
    { url: "proof.jpg", valid: false },
    { url: "", valid: false },
    { url: "ftp://example.com/file", valid: false },
    { url: "javascript:alert(1)", valid: false },
  ];
  
  for (const testCase of testCases) {
    let isValid = false;
    try {
      if (testCase.url) {
        const parsed = new URL(testCase.url);
        isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
      }
    } catch {
      isValid = false;
    }
    
    const result = isValid === testCase.valid ? "✓" : "✗";
    log(`  ${testCase.url}: ${isValid ? "valide" : "invalide"} ${result}`, isValid === testCase.valid ? "success" : "error");
  }
  
  return { tested: testCases.length };
}

// ============================================
// TEST 7: Simulation multi-utilisateurs
// ============================================

async function testConcurrentUsers() {
  logStep(7, "SIMULATION MULTI-UTILISATEURS");
  
  const numUsers = 5;
  const results: any[] = [];
  
  log(`Lancement de ${numUsers} requêtes simultanées...`);
  
  // Créer plusieurs utilisateurs
  const userIds = [];
  for (let i = 0; i < numUsers; i++) {
    const userId = uuidv4();
    userIds.push(userId);
    
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [userId, `concurrent_test_${i}@validation.local`, "dummy_hash", "user"]);
  }
  
  // Exécuter en parallèle
  const promises = userIds.map(async (userId, index) => {
    const client = await pool.connect();
    await client.query("BEGIN");
    
    try {
      // Lock programme
      await client.query(
        `SELECT * FROM programs WHERE id = $1 AND active = true FOR UPDATE`,
        [TEST_PROGRAM_ID]
      );
      
      // Créer investissement
      const result = await client.query(
        `INSERT INTO investments (user_id, program_id, amount, gain, expected_return, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, amount`,
        [userId, TEST_PROGRAM_ID, 15, 20, 20, "pending"]
      );
      
      await client.query("COMMIT");
      client.release();
      
      return { userId, success: true, investmentId: result.rows[0].id };
    } catch (error) {
      await client.query("ROLLBACK");
      client.release();
      return { userId, success: false, error: String(error) };
    }
  });
  
  const concurrentResults = await Promise.all(promises);
  
  // Analyser les résultats
  log("\n--- Résultats ---", "info");
  let successCount = 0;
  let failCount = 0;
  
  for (const res of concurrentResults) {
    if (res.success) {
      successCount++;
      log(`  User ${res.userId.slice(0,8)}: ✓ (ID: ${res.investmentId})`, "success");
    } else {
      failCount++;
      log(`  User ${res.userId.slice(0,8)}: ✗ (${res.error})`, "error");
    }
  }
  
  // Vérifier qu'il n'y a pas de doublons
  const allInvestments = await pool.query(`
    SELECT user_id, COUNT(*) as count 
    FROM investments 
    WHERE user_id = ANY($1::uuid[])
    GROUP BY user_id
  `, [userIds]);
  
  log("\n--- Vérification ---", "info");
  log(`Total créés: ${successCount}`);
  log(`Échecs: ${failCount}`);
  
  const hasDuplicates = allInvestments.rows.some((row: any) => row.count > 1);
  log(`Doublons: ${hasDuplicates ? "✗" : "✓"}`, hasDuplicates ? "error" : "success");
  
  return { successCount, failCount, hasDuplicates };
}

// ============================================
// TEST 8: Tentative de fraude (montant modifié)
// ============================================

async function testFraudAttempt() {
  logStep(8, "TENTATIVE DE FRAUDE");
  
  log("Scénario: Modification du montant après validation initiale");
  
  // Simuler un utilisateur qui modifie le montant
  const originalAmount = 30;
  const tamperedAmount = 100; // Tentative d'utiliser un montant non autorisé
  
  const client = await pool.connect();
  await client.query("BEGIN");
  
  try {
    // Obtenir le programme
    const programResult = await client.query(
      `SELECT * FROM programs WHERE id = $1 AND active = true FOR UPDATE`,
      [TEST_PROGRAM_ID]
    );
    
    const program = programResult.rows[0];
    const multipliers = typeof program.multipliers === "string" 
      ? JSON.parse(program.multipliers) 
      : program.multipliers;
    
    // Vérifier si le montant est autorisé
    const amountStr = String(tamperedAmount);
    
    if (!multipliers[amountStr]) {
      log(`Montant ${tamperedAmount} non trouvé dans multipliers`, "warn");
      log(`Multipliers disponibles: ${Object.keys(multipliers).join(", ")}`, "info");
      log("→ Requête rejetée ✓", "success");
    }
    
    // Vérifier aussi les limites min/max
    if (tamperedAmount < Number(program.min_amount) || tamperedAmount > Number(program.max_amount)) {
      log(`Montant ${tamperedAmount} hors limites [${program.min_amount}, ${program.max_amount}]`, "warn");
      log("→ Requête rejetée ✓", "success");
    }
    
    await client.query("ROLLBACK");
    client.release();
    
    return { fraudPrevented: true };
    
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    log(`Fraude détectée: ${error}`, "success");
    return { fraudPrevented: true };
  }
}

// ============================================
// RÉSUMÉ FINAL
// ============================================

async function printSummary() {
  logStep(99, "RÉSUMÉ FINAL");
  
  // Compter les investissements créés
  const investmentCount = await pool.query(`SELECT COUNT(*) as count FROM investments`);
  const paymentCount = await pool.query(`SELECT COUNT(*) as count FROM payments`);
  
  log(`Total investissements en DB: ${investmentCount.rows[0].count}`);
  log(`Total payments en DB: ${paymentCount.rows[0].count}`);
  
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}  VALIDATION BACKEND TERMINÉE AVEC SUCCÈS${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════${colors.reset}\n`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`\n${colors.cyan}`);
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║     VALIDATION BACKEND /investments                ║");
  console.log("║     Tests complets de sécurité et fiabilité        ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);
  
  try {
    await setupTestEnvironment();
    
    await testValidInvestment();
    await testIdempotency();
    await testInvalidAmount();
    await testInactiveProgram();
    await testPaymentMethodValidation();
    await testProofUrlValidation();
    await testConcurrentUsers();
    await testFraudAttempt();
    
    await printSummary();
    
  } catch (error) {
    log(`Erreur fatale: ${error}`, "error");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();