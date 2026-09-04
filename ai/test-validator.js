const { validateEntry } = require("./validator");

const testCases = [
    {
        name: "Valid entry",
        entry: {
            blood_group: "A+",
            quantity: 5,
            date: "2026-09-01"
        }
    },

    {
        name: "Invalid blood group",
        entry: {
            blood_group: "X+",
            quantity: 5,
            date: "2026-09-01"
        }
    },

    {
        name: "Negative quantity",
        entry: {
            blood_group: "A+",
            quantity: -5,
            date: "2026-09-01"
        }
    },

    {
        name: "Invalid date",
        entry: {
            blood_group: "A+",
            quantity: 5,
            date: "2026-99-99"
        }
    },

    {
        name: "Missing quantity",
        entry: {
            blood_group: "A+",
            quantity: null,
            date: "2026-09-01"
        }
    },

    {
        name: "Suspicious quantity",
        entry: {
            blood_group: "A+",
            quantity: 25,
            date: "2026-09-01"
        }
    },

    {
        name: "Unclear blood group",
        entry: {
            blood_group: "A十",
            quantity: null,
            date: null
        }
    },
    {
    name: "Decimal quantity",
    entry: {
        blood_group: "A+",
        quantity: 5.5,
        date: "2026-09-01"
    }
},

{
    name: "Quantity as string",
    entry: {
        blood_group: "A+",
        quantity: "5",
        date: "2026-09-01"
    }
},

{
    name: "Missing blood group",
    entry: {
        quantity: 5,
        date: "2026-09-01"
    }
}
];


console.log("SURKH VALIDATOR TESTS\n");

testCases.forEach((test, index) => {

    const result = validateEntry(test.entry);

    console.log(`Test ${index + 1}: ${test.name}`);
    console.log("Input:", test.entry);
    console.log("Result:", result);
    console.log("--------------------------------");
});