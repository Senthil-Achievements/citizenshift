import { redirect } from "next/navigation";

/** /explore is a breadcrumb landing — the live feed lives under/#legislation */
export default function ExploreIndex() {
  redirect("/#legislation");
}
