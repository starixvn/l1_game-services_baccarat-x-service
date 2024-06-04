import { startServiceProcess, startSetupDataProcess } from "./stubs/test-jobs";
import { ingameTest } from "./ingame.test";
import { placeBetTest } from "./place-bet.test";

let processStartService;
const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 50000;
jest.setTimeout(JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);
beforeAll((done) => {
    startSetupDataProcess(() => {
        console.log("done setup db");
        processStartService = startServiceProcess(() => {
            setTimeout(() => {
                console.log("start tests");
                done();
            }, 15000);
        });
    });
});

afterAll(() => {
    processStartService.stdin.pause();
    processStartService.kill();
});

ingameTest();
placeBetTest();
