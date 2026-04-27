import WordPressService from '../backend/services/WordPressService.js';

// Sample content similar to what's shown in the image
const sampleContent = `## Introduction
Virat Kohli is a name that resonates with cricket enthusiasts worldwide. He is an Indian international cricketer who has been making waves in the sports world with his exceptional batting skills and impressive leadership. Born on November 5, 1988, in Delhi, India, Kohli has grown to become one of the most successful and influential cricketers of all time. With a career spanning over 15 years, he has broken numerous records, won countless awards, and has been instrumental in leading the Indian cricket team to victory in various international tournaments. In this article, we will delve into the life and career of Virat Kohli, exploring his history, key concepts, important aspects, and the impact he has had on the world of cricket.

## History and Background
Virat Kohli's journey in cricket began at a young age. He started playing cricket at the age of nine and quickly rose through the ranks, representing Delhi in various age-group tournaments. His talent and dedication earned him a spot in the Indian under-19 team, which he captained to victory in the 2008 ICC Under-19 Cricket World Cup. This triumph marked the beginning of his illustrious career, and he soon made his debut for the Indian senior team in 2008. Over the years, Kohli has played for various teams, including the Royal Challengers Bangalore in the Indian Premier League (IPL) and the Delhi Capitals. His impressive performances have earned him numerous accolades, including the Arjuna Award, the Padma Shri, and the Sir Garfield Sobers Trophy.

Kohli's early life and family have played a significant role in shaping his career. His father, Prem Kohli, was a lawyer, and his mother, Saroj Kohli, was a homemaker. He has an older brother, Vikas, and an older sister, Bhavna. Kohli's family has been extremely supportive of his cricketing ambitions, and his father, in particular, has been instrumental in encouraging him to pursue his passion. Tragically, Kohli's father passed away in 2006, but his legacy lives on through his son's achievements.

## Key Concepts and Definitions
- **Batting Average**: A statistical measure of a batsman's performance, calculated by dividing the total runs scored by the number of times they have been dismissed.
- **Century**: A score of 100 or more runs in a single innings.
- **Test Cricket**: The longest format of cricket, played over five days.
- **One Day International (ODI)**: A limited-overs format of cricket, played over 50 overs per side.

## Important Aspects
Virat Kohli's career is marked by several important aspects that have contributed to his success:

1. Exceptional batting skills and technique
2. Strong leadership qualities
3. Fitness and dedication to training
4. Mental toughness and resilience
5. Ability to perform under pressure

## Conclusion
Virat Kohli is undoubtedly one of the greatest cricketers of all time. His dedication, passion, and exceptional skills have made him a role model for aspiring cricketers worldwide.`;

console.log('🎨 TESTING CONTENT FORMATTING\n');
console.log('='.repeat(80));

console.log('\n📝 Original Content (first 200 chars):');
console.log(sampleContent.substring(0, 200) + '...\n');

console.log('='.repeat(80));
console.log('\n🔄 Formatting content...\n');

const formattedContent = WordPressService.formatContent(sampleContent);

console.log('='.repeat(80));
console.log('\n✅ FORMATTED CONTENT:\n');
console.log(formattedContent);

console.log('\n' + '='.repeat(80));
console.log('\n📊 FORMATTING STATISTICS:');
console.log('   Original length:', sampleContent.length, 'characters');
console.log('   Formatted length:', formattedContent.length, 'characters');
console.log('   Contains <h2> tags:', formattedContent.includes('<h2>') ? '✓' : '✗');
console.log('   Contains <h3> tags:', formattedContent.includes('<h3>') ? '✓' : '✗');
console.log('   Contains <p> tags:', formattedContent.includes('<p>') ? '✓' : '✗');
console.log('   Contains <ul> tags:', formattedContent.includes('<ul>') ? '✓' : '✗');
console.log('   Contains <ol> tags:', formattedContent.includes('<ol>') ? '✓' : '✗');
console.log('   Has inline styles:', formattedContent.includes('style=') ? '✓' : '✗');

console.log('\n' + '='.repeat(80));
console.log('\n📄 EXCERPT GENERATION:\n');

const excerpt = WordPressService.generateExcerpt(sampleContent, 160);
console.log('Excerpt (160 chars):', excerpt);
console.log('Length:', excerpt.length);

console.log('\n' + '='.repeat(80));
console.log('\n✅ FORMATTING TEST COMPLETED!\n');

// Save formatted content to a file for inspection
import fs from 'fs';
const htmlOutput = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formatted Content Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
            margin: 0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 60px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 36px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 40px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">Virat Kohli - Formatted Content Preview</h1>
        ${formattedContent}
    </div>
</body>
</html>
`;

fs.writeFileSync('formatted-content-preview.html', htmlOutput);
console.log('📁 Preview saved to: formatted-content-preview.html');
console.log('   Open this file in a browser to see how it looks!\n');
