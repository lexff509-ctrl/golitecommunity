import { relations } from "drizzle-orm/relations";
import { users, payments, projects, sessions, notifications, countdowns, adminLogs } from "./schema";

export const paymentsRelations = relations(payments, ({one, many}) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [payments.projectId],
		references: [projects.id]
	}),
	adminLogs: many(adminLogs),
}));

export const usersRelations = relations(users, ({many}) => ({
	payments: many(payments),
	sessions: many(sessions),
	notifications: many(notifications),
	adminLogs: many(adminLogs),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	payments: many(payments),
	countdown: one(countdowns, {
		fields: [projects.countdownId],
		references: [countdowns.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const countdownsRelations = relations(countdowns, ({many}) => ({
	projects: many(projects),
}));

export const adminLogsRelations = relations(adminLogs, ({one}) => ({
	user: one(users, {
		fields: [adminLogs.adminId],
		references: [users.id]
	}),
	payment: one(payments, {
		fields: [adminLogs.paymentId],
		references: [payments.id]
	}),
}));