// Beispiel Twitch Bot für xAkiitoh
// UTF-8 Kodierung für Emojis sicherstellen
process.stdout.setEncoding('utf8');
if (process.platform === 'win32') {
    process.stdout.write('\x1b]0;xAkiitoh Bot\x07'); // Fenstertitel setzen
}

console.log('🎮 xAkiitoh Twitch Bot wird gestartet...');

const bot = {
    name: 'xAkiitoh Bot',
    version: '1.0.0',
    commands: [
        '!hello',
        '!uptime', 
        '!game',
        '!social'
    ]
};

console.log(`✅ ${bot.name} v${bot.version} ist bereit!`);
console.log('📋 Verfügbare Befehle:', bot.commands.join(', '));

// Simuliere Bot-Aktivität
setInterval(() => {
    const activities = [
        '👀 Überwache Chat...',
        '🎯 Moderiere Nachrichten...',
        '🎉 Verarbeite Befehle...',
        '💬 Beantworte Fragen...'
    ];
    
    const activity = activities[Math.floor(Math.random() * activities.length)];
    console.log(`[${new Date().toLocaleTimeString()}] ${activity}`);
}, 10000);

console.log('🚀 Bot läuft! Drücke Ctrl+C zum Beenden.');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Bot wird beendet...');
    process.exit(0);
});
