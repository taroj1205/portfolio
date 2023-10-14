import React, { useState, useEffect, useRef } from 'react';
import ncea from '@/components/doc/ncea';

interface SubjectData {
    [key: string]: {
        credits: string;
        achievement: string;
    };
}

const calculateRankScore = (subjectData: SubjectData) => {
    const assessments = Object.values(subjectData);
    const scores = assessments.map(assessment => {
        const credits = parseInt(assessment.credits);
        let factor;
        switch (assessment.achievement) {
            case 'Achieved':
                factor = 2;
                break;
            case 'Merit':
                factor = 3;
                break;
            case 'Excellence':
                factor = 4;
                break;
            default:
                factor = 0;
        }
        return { score: credits * factor, equation: `${factor}(${credits})` };
    });

    // Sort the scores in descending order and select the top 80 credits
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 80);

    // Calculate the total rank score for the top scores
    const rankScore = topScores.reduce((total, score) => total + score.score, 0);

    // Create the equation string
    const equation = topScores.map(score => score.equation).join('+');

    // Return the rank score, the assessments used, and the equation
    return { rankScore, assessments, equation };
};

const RankScore = () => {
    const rankScores: { [key: string]: number } = {};
    const assessmentDetails: { [key: string]: any } = {};

    for (const subject in ncea) {
        const subjectData = ncea[subject];
        const { rankScore, assessments, equation } = calculateRankScore(subjectData);
        rankScores[subject] = rankScore;
        assessmentDetails[subject] = assessments;
        console.log(`Equation for ${subject}: ${equation}`);
    }

    // Log the assessment details
    console.log(JSON.stringify(assessmentDetails, null, 2));

    // Find the top 5 subjects with the highest rank scores
    const topSubjects = Object.keys(rankScores)
        .sort((a, b) => rankScores[b] - rankScores[a])
        .slice(0, 5);

    // Log the top subjects
    console.log(JSON.stringify(topSubjects, null, 2));

    // Calculate the total rank score for the top subjects
    const totalTopRankScore = topSubjects.reduce((total, subject) => total + rankScores[subject], 0);

    const [score, setScore] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        });

        const refCurrent = ref.current;

        if (refCurrent) {
            observer.observe(refCurrent);
        }

        return () => {
            if (refCurrent) {
                observer.unobserve(refCurrent);
            }
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setScore((prevScore) => {
                    const newScore = prevScore + 1;
                    return newScore > totalTopRankScore ? totalTopRankScore : newScore;
                });
            }, 10);

            return () => clearInterval(interval);
        }
    }, [isVisible, totalTopRankScore]);

    return (
        <span ref={ref}>{score}</span>
    );
};

export default RankScore;