"use strict"
const assert = require(`assert`)
const commandStructureChecker = require("./cmdChecks/commandStructureChecker")

describe(`Commands`, () => {
    const commandTester = new commandStructureChecker(`./src/commands`)
    describe(`All command files should have base level properties`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkBaseProps()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    describe(`setprefix command should have the property "prefixImmune"`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkPrefixImmune()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
    })
    describe(`server_specific command(s) should have the property "servers"`, () => {
        it(`should return true`, () => {
            const result = commandTester.checkServerSpecificCmds()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)

        })
    })

    describe(`application commands should have the following properties`, () => {
        it(`should return true for property: type`, () => {
            const result = commandTester.checkAppCmds()
            const errorMsg = commandTester.getErrorMessage
            assert.strictEqual(result, true, errorMsg)
        })
        describe(`If application command has an option property it should have the following properties`, () => {
            it(`should return true for property: name`, () => {
                const result = commandTester.checkAppCmdsOpt(`name`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: name_localizations`, () => {
                const result = commandTester.checkAppCmdsOpt(`name_localizations`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: description`, () => {
                const result = commandTester.checkAppCmdsOpt(`description`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: description_localizations`, () => {
                const result = commandTester.checkAppCmdsOpt(`description_localizations`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
            it(`should return true for property: type`, () => {
                const result = commandTester.checkAppCmdsOpt(`type`)
                const errorMsg = commandTester.getErrorMessage
                assert.strictEqual(result, true, errorMsg)
            })
        })
    })
})
