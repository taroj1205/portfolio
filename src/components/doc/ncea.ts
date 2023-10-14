export interface NceaData {
    [key: string]: { // subject
        [key: string]: { // standard number
            assessment: string;
            credits: string;
            achievement: string;
        };
    };
}

const ncea: NceaData = {
    "Accounting": {
        "3.6": {
            "assessment": "Demonstrate understanding of a job cost subsystem for an entity",
            "credits": "4",
            "achievement": "Achieved"
        },
        "3.4": {
            "assessment": "Prepare a report for an external user that interprets the annual report of a New Zealand reporting entity",
            "credits": "5",
            "achievement": "Achieved"
        },
        "3.2": {
            "assessment": "Demonstrate understanding of accounting for partnerships",
            "credits": "4",
            "achievement": "Merit"
        }
    },
    "English Visuals": {
        "3.9": {
            "assessment": "Respond critically to significant aspects of visual and/or oral text(s) through close reading, supported by evidence",
            "credits": "3",
            "achievement": "Merit"
        },
        "3.7": {
            "assessment": "Respond critically to significant connections across texts, supported by evidence",
            "credits": "4",
            "achievement": "Merit"
        },
        "3.6": {
            "assessment": "Create a fluent and coherent visual text which develops, sustains, and structures ideas using verbal and visual language",
            "credits": "3",
            "achievement": "Excellence"
        },
        "3.5": {
            "assessment": "Create and deliver a fluent and coherent oral text which develops, sustains, and structures ideas",
            "credits": "3",
            "achievement": "Merit"
        }
    },
    "Calculus": {
        "3.15": {
            "assessment": "Apply systems of simultaneous equations in solving problems",
            "credits": "3",
            "achievement": "Excellence"
        },
        "3.3": {
            "assessment": "Apply trigonometric methods in solving problems",
            "credits": "4",
            "achievement": "Excellence"
        }
    },
    "Statistics": {
        "3.8": {
            "assessment": "Investigate time series data",
            "credits": "4",
            "achievement": "Merit"
        },
        "3.9": {
            "assessment": "Investigate bivariate measurement data",
            "credits": "4",
            "achievement": "Achieved"
        },
        "3.10": {
            "assessment": "Use statistical methods to make a formal inference",
            "credits": "4",
            "achievement": "Merit"
        }
    },
    "Physics": {
        "3.1": {
            "assessment": "Carry out a practical investigation to test a physics theory relating two variables in a non-linear relationship",
            "credits": "4",
            "achievement": "Achieved"
        }
    },
    "Japanese": {
        "3.5": {
            "assessment": "Write a variety of text types in clear Japanese to explore and justify varied ideas and perspectives",
            "credits": "5",
            "achievement": "Excellence"
        },
        "3.3": {
            "assessment": "Interact clearly using spoken Japanese to explore and justify varied ideas and perspectives in different situations",
            "credits": "6",
            "achievement": "Excellence"
        }
    }
};

export default ncea;
