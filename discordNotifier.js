// discordNotifier.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../discord_bot/.env') });
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Mapa de SPL a ID de canal de Discord
const splToChannelId = {
  cs: "1291139223566684191",       // Clean Sky
  ne: "1295754747923529758",       // North East Power Group (NEPG)
  nge: "1291484974155042857",      // NGE (Major Energy Electric)
  nv: "1291492151590654064",       // NextVolt Energy
  spe: "1291486281489977425",      // Spark Energy
  re: "1291491591835615334",       // Rushmore Energy
  wg: "1291491793589899335",       // WGL (Washington Gas) / Verde Energy
  ie: "1291486778611732612", // Indra Energy
};

// Inicia el bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let isReady = false;

client.once('ready', () => {
  console.log("✅ Bot de Discord para notificaciones conectado.");
  isReady = true;
});

// Exporta esta función para enviar el embed
async function notifyRateChange({ user, spl, utility_name, rate_id, field, from, to }) {
  if (!isReady) {
    console.log("⏳ Esperando a que el bot esté listo para enviar mensaje...");
    return;
  }

  const channelId = splToChannelId[spl];
  if (!channelId) {
    console.warn(`⚠️ No se encontró un canal para el proveedor SPL: ${spl}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔔 Cambio en tarifa detectado para ${utility_name}`)
    .setDescription(
      `**🪪 ⇥ ID de tarifa:** \`${rate_id}\`\n\n` +
      `**📋⇥ Campo cambiado:** \`${field}\`\n\n` +
      `**🔙⇥ Valor anterior:** \`${from}\` (${field})\n\n` +
      `**🔁⇥ Nuevo valor:** \`${to}\`\n\n` +
      `👤 **Editado por ⇥ :** ${user}`
    )
    
    .setColor(0xFFD700)
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
      console.log(`📩 Mensaje enviado al canal ${channelId} por cambio en ${spl}`);
    }
  } catch (error) {
    console.error("❌ Error al enviar mensaje a Discord:", error);
  }
}

client.login(process.env.TOKEN);

// Exporta solo la función, no el cliente
module.exports = { notifyRateChange };

// Notificar cuando se sube un archivo de SPL y se insertan filas
function sendFileUploadEmbed({ supplier, fileName, rowCount, user, timestamp }) {
  if (!rowCount || rowCount === 0) {
    console.log(`📭 No se enviará mensaje de Discord porque rowCount = ${rowCount}`);
    return;
  }
  
  const splToChannelId = {
      cs: "1291139223566684191",
      ne: "1295754747923529758",
      nge: "1291484974155042857",
      nv: "1291492151590654064",
      spe: "1291486281489977425",
      re: "1291491591835615334",
      wg: "1291491793589899335",
      ie: "1291486778611732612", // Indra Energy
  };

  const channelId = splToChannelId[supplier.toLowerCase()];
  if (!channelId) return console.error("❌ Canal no encontrado para SPL:", supplier);

  const embed = new EmbedBuilder()
      .setTitle("📥 Archivo de tarifas cargado")
      .setDescription(
          `**🏢 Proveedor (SPL):** \`${supplier.toUpperCase()}\`\n` +
          `**📄 Archivo cargado:** \`${fileName}\`\n` +
          `**📦 Filas insertadas:** \`${rowCount}\`\n\n` +
          `👤 **Subido por:** ${user}\n` +
          `🕒 **Fecha y hora:** <t:${Math.floor(new Date(timestamp).getTime() / 1000)}:f>`
      )
      .setColor(0x32CD32)
      .setFooter({ text: "Carga de archivo completa", iconURL: "https://cdn-icons-png.flaticon.com/512/2991/2991103.png" })
      .setTimestamp(new Date(timestamp));

  const channel = client.channels.cache.get(channelId);
  if (channel) {
      channel.send({ embeds: [embed] });
      console.log(`✅ Embed enviado a canal ${channelId} para ${supplier}`);
  } else {
      console.error("❌ No se encontró el canal para enviar el embed de carga.");
  }
}

module.exports.sendFileUploadEmbed = sendFileUploadEmbed;
