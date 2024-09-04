const fs = require("fs");
const readline = require("readline");

// Função para processar cada linha do arquivo de log
function isBlockAnalyze(line, initBlock = false) {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{4}$/;
  const fragments = line.split(" ");

  if (regex.test(fragments[0])) {
    if (initBlock) {
      return false;
    }

    return {
      timeStamp: new Date(fragments[0]).getTime(),
      type: fragments[2],
    };
  }

  return true;
}

async function processLogFile(filename, type, onFinish) {
  const fileStream = fs.createReadStream(filename);
  const lines = readline.createInterface({
    input: fileStream,
    output: process.stdout,
    terminal: false,
  });

  let isBlock = false;
  let index = -1;
  const blocks = [];
  let isCommand = false;

  for await (const line of lines) {
    const res = isBlockAnalyze(line, isBlock);
    if (typeof res !== "boolean") {
      index++;
      blocks[index] = {
        command: "",
        params: [],
      };
    } else if (res === false) {
      isBlock = res;
    } else if (res === true) {
      if (line.length > 0) {
        if (line.startsWith("--------------------------------------")) {
          isCommand = true;
        } else if (line.startsWith("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")) {
          isCommand = false;
        } else if (isCommand) {
          blocks[index].command += `${line.trim()} `;
        }

        if (line.startsWith("param")) {
          blocks[index].params.push(
            line.slice(line.indexOf('"') + 1, line.length - 1).trim()
          );
        }
      } else {
        isCommand = false;
      }
    }
  }

  fs.writeFile(
    "commands/" + type + ".json",
    JSON.stringify(blocks.filter((block) => block.command.length > 0)),
    (err) => {
      if (err) {
        console.error("Erro ao escrever arquivo:", err);
      } else {
        console.log("Arquivo JSON salvo com sucesso!");
      }
      onFinish && onFinish();
    }
  );
}

const rl = readline.createInterface({
  input: process.stdin, // Use o stdin (entrada padrão)
  output: process.stdout, // Use o stdout (saída padrão)
});

rl.question("Qual ação está sendo executada: ", async (resposta) => {
  rl.close();
  let filename = resposta.toLocaleLowerCase();
  filename = filename.replace(/[áàãâä]/gi, "a");
  filename = filename.replace(/[éèêë]/gi, "e");
  filename = filename.replace(/[íìîï]/gi, "i");
  filename = filename.replace(/[óòõôö]/gi, "o");
  filename = filename.replace(/[úùûü]/gi, "u");
  filename = filename.replace(/[ç]/gi, "c");
  filename = filename.replace(/[@!?,.]/g, "");
  filename = filename.replace(/[ ]/g, "_");
  const logFilePath = "C:\\Program Files\\Firebird\\Firebird_2_5\\HOST.log";
  await processLogFile(logFilePath, filename, () => process.exit(0));
});
