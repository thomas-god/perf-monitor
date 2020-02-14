#!/usr/bin/env node
const os = require('os');

/**
 * Convert os.cpus data into load values
 * @param {Date object} t Current time in ms since epoch
 * @param {os.cpus return object} cpus_p CPUs object from the previous timestep
 * @param {os.cpus return object} cpus CPUs object from the current time step
 */
function cpuLoad(t, cpus_p, cpus) {
    return new Promise((resolve, reject) => {
        let load = [];
        for (let i = 0, len = cpus.length; i < len; i++) {
            let cpu = cpus[i].times, cpup = cpus_p[i].times;
            let total = (cpu.user - cpup.user
                + cpu.sys - cpup.sys
                + cpu.idle - cpup.idle)
            load.push(total > 0 ?
                (cpu.user - cpup.user) / total * 100 : 0
            )
        }
        console.log(t, load[0].toFixed(2));
        resolve();
    })

}

/**
 * Sleep function to be used as await sleep(timeout)
 * @param {number} timeout Timeout number is ms
 * 
 * @returns {Promise} Promise that will resolve after timeout ms
 */
function sleep(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeout);
    })
}

function parseArgs() {
    const args = process.argv.slice(2);
    let options = {};

    while (args.length) {
        let tmp = args.splice(0, 2);
        options[tmp[0]] = tmp[1];
    }
    return options;

}

(async () => {
    // Initialisation
    let cpup = os.cpus();
    await sleep(500);
    console.log(parseArgs());

    // Infinite loop
    while (true) {
        // Get measures
        let cpu = os.cpus();
        let t = new Date();
        // Launch async measures processing
        cpuLoad(t, cpup, cpu);
        // Update previous values
        cpup = JSON.parse(JSON.stringify(cpu));
        // Sleep until next timestp
        await sleep(500);
    }
})()