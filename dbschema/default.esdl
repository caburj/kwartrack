module default {
  type User {
    required email: str {
      constraint exclusive;
    }
    required name: str;
  }
}
