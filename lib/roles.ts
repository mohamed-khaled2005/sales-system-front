import type { Department, Role } from "./types";

export interface RoleInfo {
  value: Role;
  label: string;
  enLabel: string;
  category: "executive" | "sales_marketing" | "ads_media" | "creative" | "production" | "operations" | "support";
  categoryLabel: string;
  defaultDeptSlug: string;
  compatibleDeptSlugs: string[];
}

export const ROLES_REGISTRY: Record<Role, RoleInfo> = {
  ceo: {
    value: "ceo",
    label: "الرئيس التنفيذي (CEO)",
    enLabel: "Chief Executive Officer",
    category: "executive",
    categoryLabel: "الإدارة التنفيذية العليا",
    defaultDeptSlug: "management",
    compatibleDeptSlugs: ["management", "system"],
  },
  admin: {
    value: "admin",
    label: "مدير النظام (System Admin)",
    enLabel: "System Administrator",
    category: "executive",
    categoryLabel: "الإدارة والتقنية",
    defaultDeptSlug: "system",
    compatibleDeptSlugs: ["system", "management"],
  },
  sales_leader: {
    value: "sales_leader",
    label: "مدير المبيعات (Sales Leader)",
    enLabel: "Sales Leader",
    category: "sales_marketing",
    categoryLabel: "المبيعات وتطوير الأعمال",
    defaultDeptSlug: "sales",
    compatibleDeptSlugs: ["sales"],
  },
  sales: {
    value: "sales",
    label: "مسؤول مبيعات (Sales Executive)",
    enLabel: "Sales Executive",
    category: "sales_marketing",
    categoryLabel: "المبيعات وتطوير الأعمال",
    defaultDeptSlug: "sales",
    compatibleDeptSlugs: ["sales"],
  },
  account_manager: {
    value: "account_manager",
    label: "مدير حسابات (Account Manager)",
    enLabel: "Account Manager",
    category: "sales_marketing",
    categoryLabel: "إدارة الحسابات والعملاء",
    defaultDeptSlug: "account-management",
    compatibleDeptSlugs: ["account-management", "customer-support"],
  },
  media_buyer: {
    value: "media_buyer",
    label: "ميديا باير / مسؤول إعلانات (Media Buyer)",
    enLabel: "Media Buyer / Performance Marketer",
    category: "ads_media",
    categoryLabel: "الإعلانات وشراء الميديا",
    defaultDeptSlug: "media-buying",
    compatibleDeptSlugs: ["media-buying", "social-media"],
  },
  social_media_manager: {
    value: "social_media_manager",
    label: "مدير السوشيال ميديا (Social Media Manager)",
    enLabel: "Social Media Manager",
    category: "ads_media",
    categoryLabel: "السوشيال ميديا والتسويق",
    defaultDeptSlug: "social-media",
    compatibleDeptSlugs: ["social-media", "content", "media-buying"],
  },
  copywriter: {
    value: "copywriter",
    label: "كاتب إعلاني ومحتوى (Copywriter)",
    enLabel: "Copywriter & Ad Scriptwriter",
    category: "creative",
    categoryLabel: "المحتوى والإبداع",
    defaultDeptSlug: "content",
    compatibleDeptSlugs: ["content", "media-buying", "social-media"],
  },
  content_creator: {
    value: "content_creator",
    label: "صانع محتوى (Content Creator)",
    enLabel: "Content Creator",
    category: "creative",
    categoryLabel: "المحتوى والإبداع",
    defaultDeptSlug: "content",
    compatibleDeptSlugs: ["content", "social-media"],
  },
  art_director: {
    value: "art_director",
    label: "مدير فني (Art Director)",
    enLabel: "Art Director",
    category: "creative",
    categoryLabel: "الفن والتصميم",
    defaultDeptSlug: "art-direction",
    compatibleDeptSlugs: ["art-direction", "design"],
  },
  designer: {
    value: "designer",
    label: "مصمم جرافيك (Graphic / Senior Designer)",
    enLabel: "Graphic Designer",
    category: "creative",
    categoryLabel: "الفن والتصميم",
    defaultDeptSlug: "design",
    compatibleDeptSlugs: ["design", "art-direction"],
  },
  video_editor: {
    value: "video_editor",
    label: "مونتير فيديو (Video Editor)",
    enLabel: "Video Editor & Motion Designer",
    category: "production",
    categoryLabel: "الإنتاج والمونتاج",
    defaultDeptSlug: "video",
    compatibleDeptSlugs: ["video", "production"],
  },
  production: {
    value: "production",
    label: "مسؤول إنتاج وتصوير (Production Lead)",
    enLabel: "Production Lead",
    category: "production",
    categoryLabel: "الإنتاج والمونتاج",
    defaultDeptSlug: "production",
    compatibleDeptSlugs: ["production", "video"],
  },
  photographer: {
    value: "photographer",
    label: "مصور فوتوغرافي وفيديو (Photographer)",
    enLabel: "Photographer / Videographer",
    category: "production",
    categoryLabel: "الإنتاج والمونتاج",
    defaultDeptSlug: "production",
    compatibleDeptSlugs: ["production"],
  },
  operations_manager: {
    value: "operations_manager",
    label: "مدير العمليات (Operations Manager)",
    enLabel: "Operations Manager",
    category: "operations",
    categoryLabel: "العمليات والتشغيل",
    defaultDeptSlug: "operations",
    compatibleDeptSlugs: ["operations", "management"],
  },
  team_leader: {
    value: "team_leader",
    label: "قائد فريق (Team Leader)",
    enLabel: "Team Leader",
    category: "operations",
    categoryLabel: "العمليات والتشغيل",
    defaultDeptSlug: "operations",
    compatibleDeptSlugs: [
      "operations",
      "sales",
      "content",
      "design",
      "video",
      "media-buying",
      "account-management",
      "customer-support",
      "social-media",
      "production",
    ],
  },
  finance: {
    value: "finance",
    label: "المدير المالي (Finance Manager)",
    enLabel: "Finance Manager",
    category: "executive",
    categoryLabel: "المالية والحسابات العامة",
    defaultDeptSlug: "finance",
    compatibleDeptSlugs: ["finance", "management"],
  },
  quality: {
    value: "quality",
    label: "مدير الجودة والأداء (Quality Manager)",
    enLabel: "Quality Assurance Manager",
    category: "operations",
    categoryLabel: "الجودة والتدقيق",
    defaultDeptSlug: "quality",
    compatibleDeptSlugs: ["quality", "operations"],
  },
  hr: {
    value: "hr",
    label: "مدير الموارد البشرية (HR Manager)",
    enLabel: "HR Manager",
    category: "executive",
    categoryLabel: "الموارد البشرية والشؤون الإدارية",
    defaultDeptSlug: "hr",
    compatibleDeptSlugs: ["hr", "management"],
  },
  customer_support: {
    value: "customer_support",
    label: "خدمة العملاء والدعم (Customer Support)",
    enLabel: "Customer Support Specialist",
    category: "support",
    categoryLabel: "خدمة العملاء",
    defaultDeptSlug: "customer-support",
    compatibleDeptSlugs: ["customer-support", "account-management"],
  },
};

export const allRolesList = Object.values(ROLES_REGISTRY);

export const roleCategories: { key: string; label: string; roles: RoleInfo[] }[] = [
  {
    key: "executive",
    label: "الإدارة العليا والشؤون العامة",
    roles: allRolesList.filter((r) => r.category === "executive"),
  },
  {
    key: "sales_marketing",
    label: "المبيعات وإدارة الحسابات",
    roles: allRolesList.filter((r) => r.category === "sales_marketing"),
  },
  {
    key: "ads_media",
    label: "شراء الإعلانات والتسويق الرقمي (Ads & Media Buying)",
    roles: allRolesList.filter((r) => r.category === "ads_media"),
  },
  {
    key: "creative",
    label: "الإبداع والتصميم وصناعة المحتوى",
    roles: allRolesList.filter((r) => r.category === "creative"),
  },
  {
    key: "production",
    label: "الإنتاج والمونتاج والتصوير",
    roles: allRolesList.filter((r) => r.category === "production"),
  },
  {
    key: "operations",
    label: "العمليات وقيادة الفرق والجودة",
    roles: allRolesList.filter((r) => r.category === "operations"),
  },
  {
    key: "support",
    label: "خدمة العملاء والدعم",
    roles: allRolesList.filter((r) => r.category === "support"),
  },
];

export function getRoleInfo(role?: string | null): RoleInfo | undefined {
  if (!role) return undefined;
  return ROLES_REGISTRY[role as Role];
}

export function getRoleLabel(role?: string | null): string {
  if (!role) return "عضو الفريق";
  return ROLES_REGISTRY[role as Role]?.label || role.replaceAll("_", " ");
}

export function getCompatibleDepartments(role: Role | string, departments: Department[]): Department[] {
  const info = getRoleInfo(role);
  if (!info) return departments;
  return departments.filter((d) => info.compatibleDeptSlugs.includes(d.slug));
}

export function getDefaultDepartment(role: Role | string, departments: Department[]): Department | undefined {
  const info = getRoleInfo(role);
  if (!info) return undefined;
  return (
    departments.find((d) => d.slug === info.defaultDeptSlug) ||
    departments.find((d) => info.compatibleDeptSlugs.includes(d.slug)) ||
    departments[0]
  );
}

export function isRoleCompatibleWithDept(role: Role | string, dept?: Department | null): boolean {
  if (!dept) return true;
  const info = getRoleInfo(role);
  if (!info) return true;
  return info.compatibleDeptSlugs.includes(dept.slug);
}

export function getRolesForDepartment(deptSlug?: string): RoleInfo[] {
  if (!deptSlug) return allRolesList;
  return allRolesList.filter((r) => r.compatibleDeptSlugs.includes(deptSlug));
}
