/**
 * Fix Virat Kohli Article Formatting
 * Apply inline styles matching formatted-content-preview.html
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';
import ImageService from '../backend/services/ImageService.js';

dotenv.config();

async function fixViratFormatting() {
  try {
    console.log('\n🔧 FIXING VIRAT KOHLI ARTICLE FORMATTING\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const article = await Article.findOne({ title: 'Virat Kohli' });
    
    if (!article) {
      console.log('❌ Article not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found article: ${article.title}\n`);

    // Get real Unsplash images
    console.log('🖼️ Fetching Unsplash images...');
    const img1 = await ImageService.getContentImageUrl('cricket player batting action');
    const img2 = await ImageService.getContentImageUrl('cricket stadium crowd');
    const img3 = await ImageService.getContentImageUrl('cricket team celebrating');
    const img4 = await ImageService.getContentImageUrl('cricket captain leadership');
    const img5 = await ImageService.getContentImageUrl('cricket player portrait');
    const img6 = await ImageService.getContentImageUrl('cricket match victory');
    
    console.log('✅ Images fetched\n');

    // Create content with inline styles matching formatted-content-preview.html
    const formattedContent = `<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Introduction</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli is a name that resonates with cricket enthusiasts worldwide. He is an Indian international cricketer who has been making waves in the sports world with his exceptional batting skills and impressive leadership. Born on November 5, 1988, in Delhi, India, Kohli has grown to become one of the most successful and influential cricketers of all time. With a career spanning over 15 years, he has broken numerous records, won countless awards, and has been instrumental in leading the Indian cricket team to victory in various international tournaments. In this article, we will delve into the life and career of Virat Kohli, exploring his history, key concepts, important aspects, and the impact he has had on the world of cricket.</p>

<img src="${img1}" alt="Virat Kohli batting in action" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">History and Background</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli's journey to becoming one of the greatest cricketers of all time began at a young age. Born into a middle-class family in Delhi, Kohli was introduced to cricket by his father, Prem Kohli, who was a criminal lawyer. Kohli's father recognized his son's passion for the sport and encouraged him to pursue it. Kohli joined the West Delhi Cricket Academy at the age of nine, where he was coached by Rajkumar Sharma. Under Sharma's guidance, Kohli honed his skills and quickly rose through the ranks.</p>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Kohli's hard work and dedication paid off when he was selected to represent Delhi in the Under-15 category. He continued to impress with his performances, and soon he was selected to play for the Indian Under-19 team. In 2008, Kohli led the Indian Under-19 team to victory in the ICC Under-19 Cricket World Cup, which was held in Malaysia. This victory marked the beginning of Kohli's illustrious career, and he soon made his debut for the Indian national team.</p>

<img src="${img2}" alt="Cricket stadium with enthusiastic crowd" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Key Concepts and Playing Style</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli is known for his aggressive and attacking playing style. He is a right-handed batsman who is capable of playing shots all around the ground. Kohli's batting technique is characterized by his strong footwork, excellent hand-eye coordination, and ability to play both pace and spin bowling with ease. He is particularly known for his ability to chase down targets, and his record in run chases is unparalleled.</p>

<ul style="margin: 24px 0; padding-left: 28px; list-style-type: disc;">
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;"><strong>Batting Average</strong>: One of the highest in modern cricket across all formats</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;"><strong>Fitness</strong>: Known for rigorous training and exceptional physical conditioning</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;"><strong>Consistency</strong>: Ability to perform at the highest level consistently</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;"><strong>Chase Master</strong>: Exceptional record in chasing targets in ODI cricket</li>
</ul>

<img src="${img3}" alt="Cricket team celebrating victory" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Career Achievements and Records</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli's career is studded with numerous achievements and records. He is the fastest batsman to reach 8,000, 9,000, 10,000, 11,000, and 12,000 runs in One Day International (ODI) cricket. Kohli has also scored the most centuries in run chases in ODI cricket, with 26 centuries to his name. In Test cricket, Kohli has scored over 8,000 runs and has 27 centuries to his name.</p>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Kohli has been awarded numerous accolades for his performances. He has been named the ICC ODI Player of the Year three times (2012, 2017, and 2018) and has also been named the ICC Cricketer of the Year twice (2017 and 2018). In 2018, Kohli was also named the Wisden Leading Cricketer in the World. These awards are a testament to Kohli's exceptional talent and his contribution to the sport of cricket.</p>

<img src="${img4}" alt="Cricket captain leading the team" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Leadership and Captaincy</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">In 2017, Virat Kohli was appointed as the captain of the Indian cricket team in all three formats of the game (Test, ODI, and T20). Under his leadership, the Indian team has achieved significant success, including winning several bilateral series and reaching the semi-finals of the 2019 ICC Cricket World Cup. Kohli's captaincy is characterized by his aggressive approach and his ability to inspire his teammates to perform at their best.</p>

<ol style="margin: 24px 0; padding-left: 28px;">
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">Emphasis on fitness and physical conditioning</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">Aggressive and positive approach to the game</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">Building a strong and competitive team culture</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">Supporting and backing young talent</li>
  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">Leading by example on and off the field</li>
</ol>

<img src="${img5}" alt="Cricket player in action" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Impact and Legacy</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli's impact on the world of cricket extends beyond his on-field performances. He has inspired a generation of young cricketers in India and around the world. Kohli's dedication to fitness and his professional approach to the game have set new standards for cricketers. He has also been a vocal advocate for mental health awareness and has spoken openly about the importance of maintaining mental well-being in professional sports.</p>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Off the field, Kohli is known for his philanthropic work. He has been involved in various charitable initiatives, including supporting underprivileged children and promoting education. Kohli is also a successful entrepreneur and has invested in several business ventures, including a chain of fitness centers and a fashion brand.</p>

<img src="${img6}" alt="Cricket match victory celebration" style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">Conclusion</h2>

<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">Virat Kohli is undoubtedly one of the greatest cricketers of all time. His exceptional batting skills, aggressive playing style, and impressive leadership have made him a household name in the world of cricket. With a career spanning over 15 years, Kohli has broken numerous records and has been instrumental in leading the Indian cricket team to victory in various international tournaments. His impact on the sport extends beyond his on-field performances, as he has inspired a generation of young cricketers and has set new standards for fitness and professionalism. As Kohli continues to play at the highest level, his legacy in the world of cricket is assured, and he will be remembered as one of the all-time greats of the game.</p>`;

    // Update article
    console.log('💾 Updating article with properly formatted content...');
    article.content = formattedContent;
    article.wordCount = formattedContent.split(/\s+/).filter(w => w.length > 0).length;
    article.excerpt = 'Virat Kohli is a name that resonates with cricket enthusiasts worldwide. He is an Indian international cricketer who has been making waves in the sports world with his exceptional batting skills...';
    article.updatedAt = new Date();

    await article.save();
    console.log('✅ Article updated successfully');

    // Verify
    const updated = await Article.findById(article._id);
    const finalImgs = (updated.content.match(/<img[^>]+>/gi) || []).length;
    const unsplashImgs = (updated.content.match(/unsplash\.com/g) || []).length;
    const pixabayImgs = (updated.content.match(/pixabay\.com/g) || []).length;
    
    console.log('\n✅ Verification:');
    console.log(`📊 Word Count: ${updated.wordCount}`);
    console.log(`📊 Total Images: ${finalImgs}`);
    console.log(`📊 Unsplash Images: ${unsplashImgs}`);
    console.log(`📊 Pixabay Images: ${pixabayImgs}`);
    console.log(`📊 Has inline styles: ${updated.content.includes('font-size: 17px') ? 'Yes' : 'No'}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ FORMATTING FIXED');
    console.log('='.repeat(70));
    console.log('✓ Inline styles applied to all elements');
    console.log('✓ Proper HTML structure with <h2> tags');
    console.log('✓ Real images embedded');
    console.log('✓ Matching formatted-content-preview.html style');
    console.log('\n📝 Refresh WordPress to see the beautifully formatted article!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting Formatting Fix...\n');
fixViratFormatting()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
