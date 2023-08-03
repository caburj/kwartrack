import { login } from "@/db/actions";

export default function Home() {
  return (
    <form action={login}>
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        placeholder="Enter your email"
      />
      <input type="submit" value="Submit" />
    </form>
  );
}
