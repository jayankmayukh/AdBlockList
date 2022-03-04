import { writeFile } from 'fs';
import isValidDomain from 'is-valid-domain';
import fetch from 'node-fetch';
import path from 'path';

const urlToLines = async (url) => {
    const resp = await fetch(url);
    const text = await resp.text();
    return text.split('\n').filter((url) => url);
};

const delim = '\n######################################################\n';

const urls = await urlToLines('https://v.firebog.net/hosts/lists.php?type=tick');

const hostsSet = new Set();

let hostCount = 0;

const promiseList = urls.map(async (url) => {
    try {
        const hostLines = await urlToLines(url);
        console.log(`${url} done!`);
        return hostLines;
    } catch (err) {
        console.error(delim);
        console.error(`Error while fetching '${url}'`);
        console.error(err);
        console.error(delim);
    }
});

const hostLinesList = await Promise.all(promiseList);

hostLinesList.forEach((hostLines, i) => {
    hostLines.forEach((line) => {
        try {
            if (line.length < 8 || line.slice(0, 7) !== '0.0.0.0') return false;
            const domain = line.split('0.0.0.0')[1]?.trim();
            if (domain && isValidDomain(domain)) {
                hostsSet.add(domain);
                hostCount += 1;
            }
        } catch (err) {
            console.error(delim);
            console.error(`Error while processing '${line}' from ${urls[i]}`);
            console.error(err);
            console.error(delim);
        }
    });
});

console.log(delim)

let hosts = '';
for (let host of hostsSet) {
    hosts += host;
    hosts += '\n';
}

writeFile('./hosts.csv', hosts, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Wrote ${hostCount} hostnames to ${path.resolve('./hosts.csv')}`);
    }
});