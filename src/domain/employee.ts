export const employeeRoles = ["employee", "analyst"] as const;
export const analystLevels = ["N1", "N2"] as const;
export const availabilities = ["online", "busy", "offline"] as const;

export type EmployeeRole = (typeof employeeRoles)[number];
export type AnalystLevel = (typeof analystLevels)[number];
export type Availability = (typeof availabilities)[number];
