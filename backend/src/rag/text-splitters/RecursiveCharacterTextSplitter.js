import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { convertTextToLangChainDoc } from "../utils/convert-text-to-lang-chain-doc.js";

const text =
  "Jedox is the world’s most adaptable planning and performance management platform. It has 50+ sales reps operating in four global regions. Over 2,500 organizations in 140 countries use Jedox to model scenarios, collate and analyze project data from any source, and simplify cross-organizational plans across all business systems.\n" +
  "\n" +
  "Jedox approached Cuvama to help shorten their sales cycles, differentiate themselves in the market, and move their sales conversations to focus on customer problems and business outcomes. \n" +
  "\n" +
  "Cuvama helped Jedox’s sales team execute consistent discovery and implement a scalable value-based selling approach. Cuvama is now used by all of Jedox’s reps to uncover prospect pain faster, articulate the unique value Jedox can have, and build compelling business cases. Cuvama’s platform is now a key component in their sales process. \n" +
  "\n" +
  "We spoke to Jedox CRO Jonathan Wood, who told us how Cuvama has helped his team make these changes and the impact it has had.\n" +
  "\n" +
  "Before Cuvama\n" +
  "Before Cuvama, the sales discovery was inconsistent and lots of Jedox’s sales conversations moved too quickly to discussing products. While this strategy closed some deals, it made it difficult for Jedox to differentiate themselves and highlight the unique value it could bring. This led to longer sales cycles and lower deal sizes than Jedox wanted. \n" +
  "\n" +
  "Some of the challenges the team faced:\n" +
  "\n" +
  "Uncovering customers’ compelling pain quickly\n" +
  "Multi-threading deals\n" +
  "Differentiating themselves in the market \n" +
  "Articulating the quantified business impact Jedox could have\n" +
  "Long sales cycles \n" +
  " \n" +
  "With a complex and valuable product which promised a big impact to lots of buyer personas, multi-threading deals was key for Jedox. But it also presented some challenges for them. \n" +
  "\n" +
  "“Sales reps want to speak to the people that will speak to them. Sometimes you need to ask challenging questions that the person you’re speaking to might not know. This allows you to broaden your reach into a company and get more people involved. But it can also be hard for reps to do”\n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox\n" +
  "\n" +
  "Some Jedox sales reps tested value selling and were impressed by the results. \n" +
  "\n" +
  "It enabled them to do two things:\n" +
  "\n" +
  "Make their sales team more efficient by qualifying out leads that they were unlikely to win and focusing resources on best-fit opportunities. \n" +
  "Go beyond differentiating the product, and differentiate their discovery-led sales approach instead.\n" +
  " \n" +
  "\n" +
  "Jedox needed to replicate this approach across the company and implement a consistent process. However, they knew that this would require all sales reps to adopt a completely new mindset. They couldn’t achieve this just through training and implementing new methodologies.\n" +
  "\n" +
  "After Cuvama\n" +
  "“Engaging Cuvama was the trigger for our sales organization to start to think differently…  This isn’t about ‘using a tool.’ Cuvama offers us a consistent and scalable value selling approach, allowing us to run a sales cycle which focuses on the outcomes our customers are looking to achieve.”” \n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox\n" +
  "\n" +
  "Cuvama has been critical in transforming Jedox to a customer outcomes-focused organization that sells and delivers value to customers. It bottles up what their best reps are doing to provide Jedox with a consistent selling approach, supported and enhanced by Cuvama’s technology.\n" +
  "\n" +
  "Enabling consistent and deeper discovery\n" +
  "The Cuvama platform empowers Jedox’s sales reps to take a discovery-first approach, uncovering prospects’ challenges and identifying how Jedox can deliver specific value outcomes that are relevant to them.\n" +
  "\n" +
  "Cuvama also enables Jedox reps to lead discovery conversations with a Point of View by helping them to understand the common problems that individual personas and customer segments experience. This improves their credibility with the prospect and encourages the prospect to engage in the full discovery process.\n" +
  "\n" +
  "The Jedox sales team can now go beyond simply selling a tool for planning efficiency. Instead, they present themselves as partners who can help overcome the prospect’s business critical challenges. This helped them differentiate not just the product, but also the sale as well. \n" +
  "\n" +
  "“There’s a higher degree of confidence in our reps to engage with our customers. Whoever they speak to, they always have a talking point. That confidence is turning into an accelerated sales cycle”.\n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox\n" +
  "\n" +
  "Adding value to sellers and buyers\n" +
  "Cuvama’s adoption rate amongst Jedox’s sales reps, SDRs and solution consultants is high. All of Jedox’s 50 global reps have adopted Cuvama, and it is being used across 60% of the pipeline.\n" +
  "\n" +
  "Cuvama also enables Jedox’s reps to add value to buyers, helping them build their own business cases for projects. \n" +
  "\n" +
  " \n" +
  "\n" +
  " “I knew we were onto something when prospects were starting to ask for licences themselves because they wanted to play around with the tool and build their own business cases to go to their leadership team” \n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox\n" +
  "\n" +
  "The Results\n" +
  "Cuvama has enabled Jedox’s reps to have more granular discovery conversations that seek to understand what outcomes the customer wants to achieve, rather than simply talking about features.\n" +
  "\n" +
  "This has allowed Jedox’s salespeople to differentiate based on their deep discovery approach. It has also enabled them to build more trusting relationships with prospects and gain greater insight from their conversations.\n" +
  "\n" +
  "The discovery and solution development processes are now taking much less time, reducing the length of sales cycles by 30% and boosting the company’s win rate. \n" +
  "\n" +
  "The size of deals has also increased because Jedox’s reps are able to articulate the tangible value they bring to their customers. \n" +
  "\n" +
  "Best of all, Jedox’s sales reps have started adopting a more discovery-focused mindset. They now do more planning before speaking to customers, predicting the kind of conversations they are likely to have and ensuring they have the right information and can lead with a Point of View. \n" +
  "\n" +
  "With Cuvama there to support them, they are now more confident in approaching larger deals. \n" +
  "\n" +
  "“This intimacy of engagement that Cuvama enables helps to land larger customer engagements, materially reduce sales cycles, and differentiate to win more against the competition. Our collaboration has removed the complexity of selling, and the uncertainty of buying. As a result, Cuvama has helped to reduce sales cycle length by 30% on average.”\n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox\n" +
  "\n" +
  "What's Next\n" +
  "The impact Cuvama has had on Jedox is significant—but there is more to come.\n" +
  "\n" +
  "Jedox are looking at rolling Cuvama out to their implementation and Customer Success teams so that they can have a value based customer relationship on an ongoing basis. A key objective for Jedox is to track and measure the key outcomes a customer was looking to achieve, and measure success against these.\n" +
  "\n" +
  "Find out more about Cuvama.\n" +
  "\n" +
  "“Once your Customer Success team can track and measure the metrics a customer was looking to achieve, you can reengage the customer on a regular basis about teh value you’re driving. This enables you to ask ‘what did we achieve’ and ‘if we’ve achieved those things, how can we do more together’” \n" +
  "\n" +
  "Jonathan Wood, CRO, Jedox";
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 0,
  separators: ["\n\n", "\n", "(?<=. )", " ", ""],
});

async function run() {
  const langChainDoc = convertTextToLangChainDoc(text);
  const result = await splitter.splitDocuments([langChainDoc]);
  console.log(`Total number of chunks:`, result[0]);
  result.forEach((doc, index) => {
    console.log(`Chunk ${index + 1}: ${doc.pageContent}`);
  });
}

// run();
