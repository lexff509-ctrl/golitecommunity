import "dotenv/config";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  console.log("🌱 Seeding admin user...");

  const adminEmail = "admin@golite.com";
  const adminPassword = "123456";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log("✅ Admin user already exists:", adminEmail);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const [admin] = await db
    .insert(users)
    .values({
      firstName: "Admin",
      lastName: "GoLite",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    })
    .returning({ id: users.id });

  console.log("✅ Admin user created!");
  console.log("   Email:", adminEmail);
  console.log("   Password:", adminPassword);
  console.log("   ID:", admin.id);
}

seedAdmin()
  .then(() => {
    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  });
