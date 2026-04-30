import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { programs, adminLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper to check admin role
async function checkAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session?.id || session.role !== "admin") {
    return null;
  }
  return session;
}

// GET /api/admin/programs - List all programs
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }

    const allPrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        minAmount: programs.min_amount,
        maxAmount: programs.max_amount,
        multipliers: programs.multipliers,
        active: programs.active,
        createdAt: programs.created_at,
        updatedAt: programs.updated_at,
      })
      .from(programs)
      .orderBy(programs.created_at);

    return NextResponse.json(allPrograms);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des programmes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/programs - Create new program
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }

    const body = await req.json();
    const { name, minAmount, maxAmount, multipliers, active } = body;

    // Validate required fields
    if (!name || !minAmount || !maxAmount || !multipliers) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // If activating, deactivate all other programs
    if (active) {
      await db.update(programs)
        .set({ active: false })
        .where(eq(programs.active, true));
    }

    // Create program
    const newProgram = await db.insert(programs).values({
      name,
      min_amount: minAmount,
      max_amount: maxAmount,
      multipliers: multipliers,
      active: active || false,
    }).returning();

        // Log action
    await db.insert(adminLogs).values({
      admin_id: admin.id,
      action: "create_program",
      target_type: "program",
      target_id: newProgram[0].id,
      details: { name, minAmount, maxAmount, active },
    });

    return NextResponse.json({
      program: newProgram[0],
      message: "Programme créé avec succès"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du programme" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/programs - Update program
export async function PATCH(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, minAmount, maxAmount, multipliers, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du programme requis" },
        { status: 400 }
      );
    }

    // If activating, deactivate all other programs
    if (active) {
      await db.update(programs)
        .set({ active: false })
        .where(eq(programs.active, true));
    }

    // Update program
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (name) updateData.name = name;
    if (minAmount) updateData.min_amount = minAmount;
    if (maxAmount) updateData.max_amount = maxAmount;
    if (multipliers) updateData.multipliers = multipliers;
    if (typeof active === "boolean") updateData.active = active;

    const updatedProgram = await db.update(programs)
      .set(updateData)
      .where(eq(programs.id, id))
      .returning();

    if (!updatedProgram[0]) {
      return NextResponse.json(
        { error: "Programme introuvable" },
        { status: 404 }
      );
    }

        // Log action
    await db.insert(adminLogs).values({
      admin_id: admin.id,
      action: "update_program",
      target_type: "program",
      target_id: id,
      details: updateData,
    });

    return NextResponse.json({
      program: updatedProgram[0],
      message: "Programme mis à jour avec succès"
    });

  } catch (error) {
    console.error("Error updating program:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du programme" },
      { status: 500 }
    );
  }
}