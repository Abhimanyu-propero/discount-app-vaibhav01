It's a Temporary file that will be deleted soon
Used keep track of my changes


/********** schema.prisma **********/
//Installed npm i mongodb
1. Changing datasource db

   FROM
   datasource db {
   provider = "sqlite"
   url      = "file:dev.sqlite"
   }

   TO
   datasource db {
   provider = "mongodb"
   url      = env("DATABASE_URL") // Set your MongoDB connection string in .env file
   }

4. Changing Prisma Schema for Session

   FROM
   model Session {
   id            String    @id
   shop          String
   state         String
   isOnline      Boolean   @default(false)
   scope         String?
   expires       DateTime?
   accessToken   String
   userId        BigInt?
   firstName     String?
   lastName      String?
   email         String?
   accountOwner  Boolean   @default(false)
   locale        String?
   collaborator  Boolean?  @default(false)
   emailVerified Boolean?  @default(false)
   }

   TO
   model Session {
   session_id    String @id @default(auto()) @map("_id") @db.ObjectId // Correctly specifies MongoDB's ObjectId
   id            String   @unique
   shop          String
   state         String
   isOnline      Boolean  @default(false)
   scope         String?
   expires       DateTime?
   accessToken   String
   userId        BigInt?
   firstName     String?
   lastName      String?
   email         String?
   accountOwner  Boolean  @default(false)
   locale        String?
   collaborator  Boolean? @default(false)
   emailVerified Boolean? @default(false)
   }

3. Changing Prisma Schema for DiscountTable

   FROM
   model discountTable {
   id Int @id @default(autoincrement())
   shop String
   offerName String
   offerType String
   productName String
   productId String            
   productVariantId String
   productPrice String    
   quantity String?
   discounting String?
   subDiscount String?
   discountedAmount String?
   startDate DateTime
   endDate DateTime
   }

   TO
   model discountTable {
   id               String   @id @default(auto()) @map("_id") @db.ObjectId
   shop             String
   offerName        String
   offerType        String
   quantity         Int?
   discounting      String?
   subDiscount      String?
   discountedAmount Int?
   startDate        DateTime
   endDate          DateTime
   offers    Json? // Stores JSON objects or arrays
   products  Json? // Stores JSON objects or arrays
   chartData Json? // Stores JSON objects or arrays
}

Problem ::-
Error coming from `npx prisma migrate deploy`

Command failed with exit code 1: npx prisma migrate deploy
Error: The "mongodb" provider is not supported with this command. For more info see https://www.prisma.io/docs/concepts/database-connectors/mongodb
   0: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:226

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MongoDB database "discountapp" at "discountapp-propero.mongocluster.cosmos.azure.com"

No migration found in prisma/migrations

Solution i have Tried
1. Changing package.Json(scripts)
   
   FROM
   "scripts": {
    "build": "remix vite:build",
    "dev": "shopify app dev",
    "config:link": "shopify app config link",
    "generate": "shopify app generate",
    "deploy": "shopify app deploy",
    "config:use": "shopify app config use",
    "env": "shopify app env",
    "start": "remix-serve ./build/server/index.js",
    "docker-start": "npm run setup && npm run start",
    "setup": "prisma generate && prisma migrate deploy",
    "lint": "eslint --cache --cache-location ./node_modules/.cache/eslint .",
    "shopify": "shopify",
    "prisma": "prisma",
    "graphql-codegen": "graphql-codegen",
    "vite": "vite"
  },

  TO
  "scripts": {
    "build": "remix vite:build",
    "dev": "shopify app dev",
    "config:link": "shopify app config link",
    "generate": "shopify app generate",
    "deploy": "shopify app deploy",
    "config:use": "shopify app config use",
    "env": "shopify app env",
    "start": "remix-serve ./build/server/index.js",
    "docker-start": "npm run setup && npm run start",
    "setup": "prisma generate && prisma db push",         //🔥->Change here
    "lint": "eslint --cache --cache-location ./node_modules/.cache/eslint .",
    "shopify": "shopify",
    "prisma": "prisma",
    "graphql-codegen": "graphql-codegen",
    "vite": "vite"
  },

2. In shopify.web.toml changing 
   `dev = "npx prisma migrate deploy && npm exec remix vite:dev"` //🔥TO->
   `dev = "npx prisma db push && npm exec remix vite:dev"`
