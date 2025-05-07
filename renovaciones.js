require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const cron = require('node-cron');

// Mapeo de SPL a IDs de canales (ajusta según tus canales reales)
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once('ready', async () => {
    console.log('El bot está en línea!');

    // Registra el comando slash si aún no está registrado
    const commands = [
        new SlashCommandBuilder()
            .setName('rw')
            .setDescription('Muestra las fechas de renovación para los próximos días.')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    // Llama a la función para enviar el mensaje diariamente
    sendDailyMessage();
    cron.schedule('0 2 * * *', sendDailyMessage); // Programa para enviar el mensaje a las 7 AM todos los días
});

// Nueva función para enviar notificaciones de cambios de tarifas
function sendRateChangeEmbed(change, username) {
    const { spl, rate_id, field, from, to, timestamp } = change;
    
    // Convertir SPL a minúsculas para buscar en el mapa
    const splLower = (spl || '').toLowerCase();
    const channelId = splToChannelId[splLower];

    if (!channelId) {
        console.error(`❌ No se encontró canal para SPL: ${spl}`);
        return false;
    }

    // Crear un embed con la información del cambio
    const embed = new EmbedBuilder()
        .setTitle("📌 Tarifa modificada")
        .setDescription(`**Rate ID:** \`${rate_id}\`\n**Campo:** ${field}\n**Valor anterior:** \`${from}\`\n**Nuevo valor:** \`${to}\``)
        .addFields(
            { name: "👤 Usuario", value: username || "Desconocido", inline: true },
            { name: "🔢 Proveedor (SPL)", value: spl?.toUpperCase() || "N/A", inline: true }
        )
        .setColor(0x00BFFF)
        .setFooter({ text: "Modificación registrada en Rates", iconURL: "https://cdn-icons-png.flaticon.com/512/929/929564.png" })
        .setTimestamp(timestamp ? new Date(timestamp) : null);

    // Enviar el embed al canal correspondiente
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send({ embeds: [embed] })
            .then(() => console.log(`✅ Mensaje enviado al canal ${channelId} para SPL ${spl}`))
            .catch(err => console.error(`❌ Error enviando mensaje a Discord:`, err));
        return true;
    } else {
        console.error(`❌ No se pudo encontrar el canal con ID ${channelId}`);
        return false;
    }
}

// Resto de tu código existente
function sendDailyMessage() {
    const channelId = '1291492540478132327'; // El ID de tu canal
    const renewalDates = getRenewalDates();

    const embed = new EmbedBuilder()
        .setTitle('Buenos Días!!! <:Corazon:1217294186928275477>')
        .setDescription(`**Estas son las fechas que necesitas para vender hoy **<a:Purple:1217293078029926480>\n\n***RENEWALS***   <a:verif_vert:1217293086120476792>\n\n\n*TODOS LOS PROVEDORES CTS USN (excepto **INDRA** y **NG&E**<a:_boost_:1217294184336064624>):*\n**120 Días : **${renewalDates.d120}  *(clientes de **NWFG**)* <a:8987_Arrow_2_Gif:1291860890748190792>\n**124 Días :  **${renewalDates.d124} *(clientes de **FIS**)* <a:8987_Arrow_2_Gif:1291860890748190792>\n\n\n\n**NG&E**<a:_boost_:1217294184336064624>\n\n**135 Días : **${renewalDates.d135} *(clientes de **NWFG**)*<a:8987_Arrow_2_Gif:1291860890748190792>\n**139 Días **: ${renewalDates.d139} *(clientes de **FIS**)*<a:8987_Arrow_2_Gif:1291860890748190792>\n\n\n\n**INDRA**<a:_boost_:1217294184336064624>\n\n**100 Días : **${renewalDates.d100} *(clientes de **NWFG**)*<a:8987_Arrow_2_Gif:1291860890748190792>\n**104 Días **: ${renewalDates.d104} *(clientes de **FIS**)*<a:8987_Arrow_2_Gif:1291860890748190792>\n`)
        .setColor(0x00E03F)
        .setFooter({ text: 'Renovaciones', iconURL: 'https://cdn.discordapp.com/icons/1217104897317797938/d1aaff5361460442984a7da18fe24de6.png?size=128' })
        .setImage('https://data.textstudio.com/output/sample/animated/2/8/5/7/let-s-do-it-1-17582.gif');

    client.channels.cache.get(channelId).send({ embeds: [embed] });
}

function getRenewalDates() {
    const today = new Date();
    return {
        d120: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 120)),
        d124: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 124)),
        d135: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 135)),
        d139: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 139)),
        d100: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 100)),
        d104: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 104))
    };
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Comando /rw
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    if (interaction.commandName === 'rw') {
        await interaction.deferReply({ ephemeral: true });  // Defer la respuesta pero hazla invisible para otros
        sendDailyMessage(); // Ejecuta la función para enviar el mensaje
        await interaction.deleteReply(); // Elimina la respuesta deferida, no dejando rastro visible
    }
});

// Exportar la función para que pueda ser importada desde la API de rates
module.exports = {
    sendRateChangeEmbed,
    client // Exportamos client para poder usar el bot desde otros módulos
};

client.login(process.env.TOKEN);
