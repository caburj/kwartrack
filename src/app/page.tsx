import { getUser } from "@/db";
import { css } from "../../styled-system/css";

export default async function Home() {
  const user = await getUser("joseph@caburnay.dev");
  return (
    <div className={css({ fontSize: "2xl", fontWeight: "bold" })}>
      Hello {user ? user.email : "🐼"}!
    </div>
  );
}
