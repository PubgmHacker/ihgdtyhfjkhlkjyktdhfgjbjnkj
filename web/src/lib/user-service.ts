import { db } from "@/lib/db";

export interface PublicUser {
  id: string;
  telegram_id: number | null;
  username: string;
  name: string;
  photo_url: string | null;
  email: string | null;
  role: string;
  is_admin: boolean;
  notify_new_drops: boolean;
  notify_promos: boolean;
  email_verified: boolean;
  created_at: string | null;
  last_login: string | null;
}

function parseProfileData(profileDataStr: string): Record<string, any> {
  try { return JSON.parse(profileDataStr || "{}"); } catch { return {}; }
}

function toPublicUser(u: any): PublicUser {
  const profile = parseProfileData(u.profileData);
  return {
    id: u.id,
    telegram_id: u.telegramId ?? null,
    username: u.username || "",
    name: u.fullName || "",
    photo_url: profile.photo_url || null,
    email: u.email || null,
    role: u.role || "user",
    is_admin: u.role === "admin" || u.role === "owner" || !!u.isAdmin,
    notify_new_drops: !!u.notifyNewDrops,
    notify_promos: !!u.notifyPromos,
    email_verified: false,
    created_at: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    last_login: u.lastLogin ? new Date(u.lastLogin).toISOString() : null,
  };
}

export type AuthProvider = "telegram" | "email";

export interface IdentityProfile {
  fullName?: string;
  username?: string;
  email?: string;
  photoUrl?: string;
  telegramId?: number;
  passwordHash?: string;
}

export async function linkOrCreateUser(
  provider: AuthProvider,
  providerUid: string,
  profile: IdentityProfile
): Promise<PublicUser> {
  const identity = await db.identity.findUnique({
    where: { provider_providerUid: { provider, providerUid } },
  });

  if (identity) {
    const current = await db.user.findUnique({ where: { id: identity.userId } });
    const updateData: Record<string, any> = { lastLogin: new Date() };
    if (profile.fullName) updateData.fullName = profile.fullName;
    if (profile.username) updateData.username = profile.username;
    if (provider === "telegram" && profile.telegramId !== undefined) {
      updateData.telegramId = profile.telegramId;
    }
    if (profile.photoUrl) {
      const pd = parseProfileData(current?.profileData || "{}");
      pd.photo_url = profile.photoUrl;
      updateData.profileData = JSON.stringify(pd);
    }
    const user = await db.user.update({ where: { id: identity.userId }, data: updateData });
    return toPublicUser(user);
  }

  const profileData: Record<string, any> = {};
  if (profile.photoUrl) profileData.photo_url = profile.photoUrl;

  const user = await db.user.create({
    data: {
      telegramId: provider === "telegram" ? profile.telegramId ?? null : null,
      email: provider === "email" ? profile.email?.toLowerCase() ?? null : null,
      username: profile.username || "",
      fullName: profile.fullName || "",
      profileData: JSON.stringify(profileData),
      lastLogin: new Date(),
      identities: {
        create: {
          provider,
          providerUid,
          passwordHash: provider === "email" ? profile.passwordHash ?? null : null,
        },
      },
    },
  });

  return toPublicUser(user);
}

export async function findEmailIdentity(email: string) {
  return db.identity.findUnique({
    where: { provider_providerUid: { provider: "email", providerUid: email.toLowerCase() } },
    include: { user: true },
  });
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await db.user.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}

export async function getOrdersForUser(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map((o) => ({
    id: o.id,
    items: JSON.parse(o.items || "[]"),
    total: o.total,
    status: o.status,
    created_at: o.createdAt ? new Date(o.createdAt).toISOString() : null,
    tracking: null,
  }));
}

export async function upsertTelegramUser(data: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}): Promise<PublicUser> {
  const telegramId = data.id;
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();

  const existing = await db.user.findUnique({ where: { telegramId } });
  const profileData: Record<string, any> = existing ? parseProfileData(existing.profileData || "{}") : {};
  if (data.photo_url) profileData.photo_url = data.photo_url;

  const user = await db.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: data.username || "",
      fullName,
      profileData: JSON.stringify(profileData),
      lastLogin: new Date(),
    },
    update: {
      username: data.username || "",
      fullName,
      profileData: JSON.stringify(profileData),
      lastLogin: new Date(),
    },
  });

  return toPublicUser(user);
}