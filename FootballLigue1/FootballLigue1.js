import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function init () {
    await Avatar.lang.addPluginPak('FootballLigue1');
}

export async function action(data, callback) {

    try {
        const L = await Avatar.lang.getPak('FootballLigue1', data.language);

        const tblActions = {
            getScore: () => getFootball("classement-equipes/general", data.client, L),
            getCalendar: () => getFootball("calendrier-resultats", data.client, L)
        };

        info("FootballLigue1:", data.action.command, ("plugin.from"), data.client);

        if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

    } catch (error) {
        if (data.client) Avatar.Speech.end(data.client);
        error("Football Ligue1 Error:", error.message);
    }

    callback();
}


// ==========================
// FOOTBALL SCRAPER
// ==========================
const getFootball = async (foot, client, L) => {

    try {
        const url = `https://www.lequipe.fr/Football/ligue-1/page-${foot}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(L.get("speech.errorHttp", response.status));
        }

        const body = await response.text();
        const $ = cheerio.load(body);

       // ==========================
// CLASSEMENT
// ==========================
if (foot === "classement-equipes/general") {

    const teams = [];

    $("tr").each((i, el) => {

        const name =
            $(el).find("td.table__col--name").text().trim() ||
            $(el).find(".Table__Team").text().trim();

        const points =
            $(el).find("td.table__col--points").text().trim() ||
            $(el).find(".Table__Points").text().trim();

        if (!name || !points) return;

        teams.push({ name, points });

        if (teams.length >= 6) return false;
    });

    if (teams.length === 0) {
        throw new Error("Aucune équipe trouvée (structure HTML modifiée)");
    }

    const message = teams.map((team, index) => {
        const positionText =
            index === 0
                ? L.get("speech.leader")
                : L.get("speech.position", index + 1);

        return L.get("speech.rank", team.name, positionText, team.points);
    }).join(', ');

    info(message);
    Avatar.speak(message, client, () => Avatar.Speech.end(client));
}

// ==========================
        // CALENDRIER RESULTATS
        // ==========================
        if (foot === "calendrier-resultats") {

            const matches = [];

            $(".TeamScore").each((i, el) => {

                const home = $(el).find(".TeamScore__team--home span").first().text().trim();

                const away = $(el).find(".TeamScore__team--away span").first().text().trim();

                const score = $(el).find(".TeamScore__score").text().replace(/\s+/g, "").trim();

                if (!home || !away || !score) return;

                matches.push({ home, away, score });

                if (matches.length >= 6) return false;
            });

            if (matches.length === 0) {
                Avatar.speak(L.get("speech.notPlayed"), client, () => Avatar.Speech.end(client));
                return;
            }

            const message = matches.map(m => {

    const [homeGoals, awayGoals] = m.score.split('-').map(Number);

    if (isNaN(homeGoals) || isNaN(awayGoals)) {
        return `${m.home} ${m.score} ${m.away}`;
    }

    if (homeGoals === awayGoals) {
        return L.get("speech.draw").replace("$$", m.home).replace("$$", m.away).replace("$$", homeGoals);
    }

    if (homeGoals > awayGoals) {
        return L.get("speech.win").replace("$$", m.home).replace("$$", m.away).replace("$$", homeGoals).replace("$$", awayGoals);
    }

    return L.get("speech.win").replace("$$", m.away).replace("$$", m.home).replace("$$", awayGoals).replace("$$", homeGoals);
}).join(', ');

            info(message);

            Avatar.speak(message, client, () => Avatar.Speech.end(client));
        }


    } catch (error) {
        error("Football error:", error.message);
        Avatar.speak(L.get("speech.errorAccess"), client, () => Avatar.Speech.end(client));
    }
};

