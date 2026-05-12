const { execSync } = require("child_process");

function run(cmd, exitOnFail = true) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    if (exitOnFail) {
      console.error(`Error ejecutando: ${cmd}`);
      process.exit(1);
    } else {
      console.log(`(Paso omitido: ${cmd})`);
    }
  }
}

// 1. Sincronizar el schema con la base de datos (crea tablas si no existen)
run("npx prisma db push --accept-data-loss");

// 2. Cargar datos iniciales (falla silenciosamente si ya existen)
run("npx tsx prisma/seed.ts", false);

// 3. Arrancar la aplicación
run("npx next start");
