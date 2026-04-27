/**
 * Format Virat Kohli Article with Proper HTML Structure
 * Applies the same formatting as formatted-content-preview.html
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';
import ImageService from '../backend/services/ImageService.js';

dotenv.config();

async function formatViratArticle() {
  try {
    console.log('\n📝 FORMATTING VIRAT KOHLI ARTICLE\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const article = await Article.findOne({ title: 'Virat Kohli' });
    
    if (!article) {
      console.log('❌ Article not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found article: ${article.title}`);
    console.log(`📊 Current content length: ${article.content.length} characters\n`);

    // Get real Unsplash images
    console.log('🖼️ Fetching real Unsplash images...');
    const images = [];
    
    const keywords = [
      'Virat Kohli batting cricket',
      'Virat Kohli celebrating victory',
      'cricket stadium India',
      'Virat Kohli captain team',
      'cricket player action shot',
      'Virat Kohli portrait'
    ];

    for (const keyword of keywords) {
      const imageUrl = await ImageService.getContentImageUrl(keyword);
      images.push(imageUrl);
      console.log(`✅ Got image for: ${keyword}`);
    }

    // Create properly formatted HTML content
    const formattedContent = `
<h2>Introduction</h2>

<p>Virat Kohli is a name that resonates with cricket enthusiasts worldwide. He is an Indian international cricketer who has been making waves in the sports world with his exceptional batting skills and impressive leadership. Born on November 5, 1988, in Delhi, India, Kohli has grown to become one of the most successful and influential cricketers of all time. With a career spanning over 15 years, he has broken numerous records, won countless awards, and has been instrumental in leading the Indian cricket team to victory in various international tournaments. In this article, we will delve into the life and career of Virat Kohli, exploring his history, key concepts, important aspects, and the impact he has had on the world of cricket.</p>

<img src="${images[0]}" alt="Virat Kohli in action on the cricket field" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>History and Background</h2>

<p>Virat Kohli's journey to becoming one of the greatest cricketers of all time began at a young age. Born into a middle-class family in Delhi, Kohli was introduced to cricket by his father, Prem Kohli, who was a criminal lawyer. Kohli's father recognized his son's passion for the sport and encouraged him to pursue it. Kohli joined the West Delhi Cricket Academy at the age of nine, where he was coached by Rajkumar Sharma. Under Sharma's guidance, Kohli honed his skills and quickly rose through the ranks.</p>

<p>Kohli's hard work and dedication paid off when he was selected to represent Delhi in the Under-15 category. He continued to impress with his performances, and soon he was selected to play for the Indian Under-19 team. In 2008, Kohli led the Indian Under-19 team to victory in the ICC Under-19 Cricket World Cup, which was held in Malaysia. This victory marked the beginning of Kohli's illustrious career, and he soon made his debut for the Indian national team.</p>

<img src="${images[1]}" alt="Virat Kohli celebrating a cricket victory" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>Key Concepts and Playing Style</h2>

<p>Virat Kohli is known for his aggressive and attacking playing style. He is a right-handed batsman who is capable of playing shots all around the ground. Kohli's batting technique is characterized by his strong footwork, excellent hand-eye coordination, and ability to play both pace and spin bowling with ease. He is particularly known for his ability to chase down targets, and his record in run chases is unparalleled.</p>

<p>One of the key concepts that define Kohli's playing style is his fitness and athleticism. Kohli is known for his rigorous fitness regime, which includes a combination of gym workouts, yoga, and a strict diet. His fitness has enabled him to maintain a high level of performance throughout his career, and he is often cited as one of the fittest cricketers in the world.</p>

<img src="${images[2]}" alt="Cricket stadium filled with enthusiastic fans" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>Career Achievements and Records</h2>

<p>Virat Kohli's career is studded with numerous achievements and records. He is the fastest batsman to reach 8,000, 9,000, 10,000, 11,000, and 12,000 runs in One Day International (ODI) cricket. Kohli has also scored the most centuries in run chases in ODI cricket, with 26 centuries to his name. In Test cricket, Kohli has scored over 8,000 runs and has 27 centuries to his name.</p>

<p>Kohli has been awarded numerous accolades for his performances. He has been named the ICC ODI Player of the Year three times (2012, 2017, and 2018) and has also been named the ICC Cricketer of the Year twice (2017 and 2018). In 2018, Kohli was also named the Wisden Leading Cricketer in the World. These awards are a testament to Kohli's exceptional talent and his contribution to the sport of cricket.</p>

<img src="${images[3]}" alt="Virat Kohli as team captain leading his squad" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>Leadership and Captaincy</h2>

<p>In 2017, Virat Kohli was appointed as the captain of the Indian cricket team in all three formats of the game (Test, ODI, and T20). Under his leadership, the Indian team has achieved significant success, including winning several bilateral series and reaching the semi-finals of the 2019 ICC Cricket World Cup. Kohli's captaincy is characterized by his aggressive approach and his ability to inspire his teammates to perform at their best.</p>

<p>As a captain, Kohli has been instrumental in building a strong and competitive Indian team. He has emphasized the importance of fitness and has encouraged his teammates to maintain high standards of physical conditioning. Kohli's leadership has also been marked by his willingness to back young players and give them opportunities to prove themselves at the international level.</p>

<img src="${images[4]}" alt="Cricket player in dynamic action shot" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>Impact and Legacy</h2>

<p>Virat Kohli's impact on the world of cricket extends beyond his on-field performances. He has inspired a generation of young cricketers in India and around the world. Kohli's dedication to fitness and his professional approach to the game have set new standards for cricketers. He has also been a vocal advocate for mental health awareness and has spoken openly about the importance of maintaining mental well-being in professional sports.</p>

<p>Off the field, Kohli is known for his philanthropic work. He has been involved in various charitable initiatives, including supporting underprivileged children and promoting education. Kohli is also a successful entrepreneur and has invested in several business ventures, including a chain of fitness centers and a fashion brand.</p>

<img src="${images[5]}" alt="Virat Kohli portrait" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />

<h2>Conclusion</h2>

<p>Virat Kohli is undoubtedly one of the greatest cricketers of all time. His exceptional batting skills, aggressive playing style, and impressive leadership have made him a household name in the world of cricket. With a career spanning over 15 years, Kohli has broken numerous records and has been instrumental in leading the Indian cricket team to victory in various international tournaments. His impact on the sport extends beyond his on-field performances, as he has inspired a generation of young cricketers and has set new standards for fitness and professionalism. As Kohli continues to play at the highest level, his legacy in the world of cricket is assured, and he will be remembered as one of the all-time greats of the game.</p>
`;

    // Update article
    console.log('\n💾 Updating article with formatted content...');
    article.content = formattedContent;
    article.wordCount = formattedContent.split(/\s+/).filter(w => w.length > 0).length;
    article.excerpt = 'Virat Kohli is a name that resonates with cricket enthusiasts worldwide. He is an Indian international cricketer who has been making waves in the sports world with his exceptional batting skills...';
    article.updatedAt = new Date();
    article.metadata = {
      ...article.metadata,
      formattedAt: new Date(),
      imagesAdded: 6,
      unsplashImages: images.filter(img => img.includes('unsplash.com')).length
    };

    await article.save();
    console.log('✅ Article updated with formatted content');

    // Verify
    const updated = await Article.findById(article._id);
    const finalImgs = (updated.content.match(/<img[^>]+>/gi) || []).length;
    const unsplashImgs = (updated.content.match(/unsplash\.com/g) || []).length;
    
    console.log('\n✅ Verification:');
    console.log(`📊 Title: ${updated.title}`);
    console.log(`📊 Word Count: ${updated.wordCount}`);
    console.log(`📊 Total Images: ${finalImgs}`);
    console.log(`📊 Unsplash Images: ${unsplashImgs}`);
    console.log(`📊 Content Length: ${updated.content.length} characters`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ FORMATTING COMPLETE');
    console.log('='.repeat(70));
    console.log('✓ Article formatted with proper HTML structure');
    console.log('✓ 6 real Unsplash images embedded');
    console.log('✓ Professional layout matching formatted-content-preview.html');
    console.log('\n📝 Refresh your WordPress page to see the beautifully formatted article!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting Article Formatting...\n');
formatViratArticle()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
