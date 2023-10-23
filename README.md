# Introduction

Use this app to track your expenses based on partitions and categories.

<img width="1503" alt="Screenshot 2023-10-23 at 19 17 12" src="https://github.com/caburj/kwartrack/assets/3245568/09f8e25b-edd9-4a6e-bb3c-d24e0683d112">
<img width="1503" alt="Screenshot 2023-10-23 at 19 17 53" src="https://github.com/caburj/kwartrack/assets/3245568/eaa734b6-e9ba-4662-a504-6a0df99005c6">

## Categories

- Categories has 3 types - `Income`, `Expense` and `Transfer`.
- Income categories can be:
  - Salary and Reimbursements
- Expense categories can be:
  - Groceries, Transportation, Rent, Bills, Restaurants, etc.
- A transfer category is used to categorize transactions that moves money from
  one partition to another.

## Partitions

- Our money normally resides in our bank accounts. And to properly manage our
  money, we create multiple accounts to serve different purpose. For example,
  one account is for the monthly budget expenses and another is for the savings.
- In this tracker, we introduce the concept of `Partitions` where each partition
  corresponse to a portion of an accounts.
  - Say we have a bank account in ING. In this tracker, we create `Main` and
    `Savings` partitions.
  - With this concept, we have a finer control on how much savings we have
    without creating another bank account. The two partitions just reside in one
    bank account.

## Transaction

- With the two concepts above, we can now introduce a transaction.
- A transaction is composed of a category, a partition (or two if the category
  is transfer) and the amount.
- To record an expense, we select an expense category, the partition to deduct
  the expense and the amount.
- We can also record a transfer using the transfer category which requires
  additional info -- the destination partition.
  - Maybe this month we didn't consumed all our budget from our main partition,
    so we want to move it to the savings.
    - We can create an expense from main and income to savings, however, this is
      better recorded with a transfer.
    - With a transfer transaction, a destination partition is requested as
      additional information.
    - In the background, a transfer transaction is actually composed of 2
      transactions.

## Summary

- Total amount of money you have in each partition is tracked in the side bar.
- Total expenses, income and transfer for each category is also summarized.
- You can also filter the list of transactions you see by clicking the
  categories and partitions.
- Extra: One partition can borrow from another which we call `Loans` in the app.
  - You can also track those.

# Getting started

## Development mode

1. Fork this repo and clone the fork in your computer.
1. Make sure edgedb is installed and have a clerk account.
1. Create a `.env` file with the following values filled from edgedb and clerk.
  ```conf
  # edgedb cloud (db) requirements
  # If blank during development, local db is used.
  EDGEDB_INSTANCE=
  EDGEDB_SECRET_KEY=

  # clerk (auth) requirements
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

  # should point to the base url of the deployed app
  NEXT_PUBLIC_HOST=
  ```
1. Initialize edgedb project with `edgedb project init`.
   - Only done once during initial setup.
1. Run the script: `create-first-user` to create your first account.
   `$ pnpm create-first-user --email=... --name=... --username=...`
   - Run this everytime `edgedb` db is cleared and the db of the corresponding
     user is dropped.
1. `$ pnpm install`
1. `$ pnpm dev`

## Deployment

Unfortunately, we don't have our own resources to have a deployment for many so
if you want to use this app, we'd ask you to deploy your own. It's a NextJS app
and is backed with EdgeDB. We also use Clerk for authentication.

- So to deploy, you need an [edgedb cloud](cloud.edgedb.com),
  [clerk](clerk.com) and [vercel](vercel.com) accounts.
  - Complete the env variables below. Values come from edgedb, clerk and vercel.
  ```conf
  # edgedb cloud (db) requirements
  EDGEDB_INSTANCE=
  EDGEDB_SECRET_KEY=

  # clerk (auth) requirements
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

  # should point to the base url of the deployed app
  NEXT_PUBLIC_HOST=
  ```
  - Deploy your to vercel.
    - Vercel will ask for the env variables which you'll provide from above.
  - From your computer, make sure you have edgedb installed.
    - Run the script: `create-first-user` to create your first account.
      - `$ pnpm create-first-user --email=... --name=... --username=...`
      - When you visit the page and authenticate using the email you specified
        in the above command, you'll be redirected to the main app.
