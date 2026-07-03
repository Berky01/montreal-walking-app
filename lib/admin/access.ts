export function areAdminToolsEnabled(): boolean {
  return process.env.ENABLE_ADMIN_TOOLS === "true";
}

export function areAdminWriteActionsEnabled(): boolean {
  return areAdminToolsEnabled() && process.env.ENABLE_ADMIN_WRITE_ACTIONS === "true";
}

export function requireAdminToolsResponse(): Response | null {
  if (areAdminToolsEnabled()) {
    return null;
  }

  return Response.json({ error: "not found" }, { status: 404 });
}

export function requireAdminWriteActionsResponse(): Response | null {
  const adminError = requireAdminToolsResponse();
  if (adminError) {
    return adminError;
  }

  if (areAdminWriteActionsEnabled()) {
    return null;
  }

  return Response.json({ error: "admin write actions are disabled" }, { status: 403 });
}
