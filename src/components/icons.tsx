import type { Icon as LucideIcon, LucideProps } from "lucide-react";
import { BookOpenCheck } from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  logo: (props: LucideProps) => <BookOpenCheck {...props} />,
};
