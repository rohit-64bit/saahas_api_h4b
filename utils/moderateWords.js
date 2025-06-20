const BAD_WORDS = [
    // Profanity
    "fuck", "shit", "damn", "bitch", "bastard", "asshole", "dick", "pussy", "cunt", "slut",
    "whore", "motherfucker", "mf", "retard", "dumbass", "jackass", "prick", "fuck", "asshole",

    // Threats & Violence
    "kill", "murder", "bomb", "shoot", "stab", "hang", "beat", "hit", "choke", "attack",
    "burn", "explode", "destroy", "die", "threat", "massacre", "execute",

    // Sexual Harassment / Abuse
    "rape", "molest", "grope", "touch you", "send nudes", "show boobs", "sex slave",
    "sexual favors", "dick pic", "nude pic", "bang", "hookup", "harass", "tease",

    // Hate Speech / Discrimination
    "nigger", "chink", "paki", "kike", "fag", "tranny", "islamist", "terrorist", "nazi",
    "jihadi", "hindu slut", "muslim pig", "rapist", "casteist", "go back to your country",

    // Bullying & Verbal Abuse
    "die", "worthless", "nobody loves you", "fat", "ugly", "loser", "kill yourself", "kys",
    "you're nothing", "waste of space", "attention seeker", "clown", "idiot",

    // Suicidal / Self-harm Phrases
    "kill myself", "i want to die", "can't go on", "end it all", "no one cares",
    "cut myself", "overdose", "hanging", "jump off", "want to disappear"
];


function moderateWords(message) {
    const lower = message.toLowerCase();
    return BAD_WORDS.some(word => lower.includes(word));
}

module.exports = moderateWords;