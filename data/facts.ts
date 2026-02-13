export interface Fact {
  id: number;
  text: string;
  image: string;
  category: string;
  gradeRange: 'Primary' | 'Secondary';
}

export const facts: Fact[] = [
  {
    id: 1,
    text: "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    category: "Science",
    gradeRange: "Primary"
  },
  {
    id: 2,
    text: "A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.",
    image: "https://images.unsplash.com/photo-1614730341194-75c60740658f?auto=format&fit=crop&w=800&q=80",
    category: "Space",
    gradeRange: "Secondary"
  },
  {
    id: 3,
    text: "Bananas are berries, but strawberries aren't! In botanical terms, berries have seeds inside the fruit flesh, like bananas, while strawberries have seeds on the outside.",
    image: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 4,
    text: "If you could fold a piece of paper 42 times, it would reach the moon. This is due to the power of exponential growth.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    category: "Math",
    gradeRange: "Secondary"
  },
  {
    id: 5,
    text: "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills, while the third pumps it to the rest of the body.",
    image: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Secondary"
  },
  {
    id: 6,
    text: "The Eiffel Tower can be 15 cm taller during the summer. When a substance is heated up, its particles move more and it takes up a larger volume.",
    image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce7859?auto=format&fit=crop&w=800&q=80",
    category: "Science",
    gradeRange: "Primary"
  },
  {
    id: 7,
    text: "The internet weighs about as much as a strawberry. All the electrons moving data around the web at any given moment weigh approximately 50 grams.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    category: "Technology",
    gradeRange: "Secondary"
  },
  {
    id: 8,
    text: "Cows have best friends and get stressed when they are separated. They form strong bonds just like humans do!",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 9,
    text: "A cloud can weigh more than a million pounds. However, it floats because the air below it is even heavier.",
    image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80",
    category: "Science",
    gradeRange: "Primary"
  },
  {
    id: 10,
    text: "The Great Wall of China is not visible from space with the naked eye. This is a common myth!",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
    category: "History",
    gradeRange: "Secondary"
  },
  {
    id: 11,
    text: "Sloths can hold their breath longer than dolphins can. They can hold their breath for up to 40 minutes underwater.",
    image: "https://images.unsplash.com/photo-1568162603664-fcd658421851?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 12,
    text: "The shortest war in history lasted only 38 minutes. It was between Britain and Zanzibar on August 27, 1896.",
    image: "https://images.unsplash.com/photo-1569408092476-b6058097d747?auto=format&fit=crop&w=800&q=80",
    category: "History",
    gradeRange: "Secondary"
  },
  {
    id: 13,
    text: "A bolt of lightning is five times hotter than the surface of the sun. It can reach temperatures of 30,000 kelvins.",
    image: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=800&q=80",
    category: "Science",
    gradeRange: "Secondary"
  },
  {
    id: 14,
    text: "Polar bear skin is black. Their fur is transparent and reflects light, making them appear white.",
    image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 15,
    text: "Humans share 50% of their DNA with bananas. We also share about 98% with chimpanzees!",
    image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80",
    category: "Biology",
    gradeRange: "Secondary"
  },
  {
    id: 16,
    text: "There are more stars in the universe than grains of sand on all the Earth's beaches.",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
    category: "Space",
    gradeRange: "Secondary"
  },
  {
    id: 17,
    text: "Butterflies taste with their feet. This helps them find out if a leaf is good food for their caterpillars.",
    image: "https://images.unsplash.com/photo-1485841890310-6b05b0088381?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 18,
    text: "Hot water freezes faster than cold water. This phenomenon is known as the Mpemba effect.",
    image: "https://images.unsplash.com/photo-1550147760-44c9966d6bc7?auto=format&fit=crop&w=800&q=80",
    category: "Science",
    gradeRange: "Secondary"
  },
  {
    id: 19,
    text: "Wombat poop is cube-shaped. This prevents it from rolling away and marks their territory effectively.",
    image: "https://images.unsplash.com/photo-1593482885263-657c91559869?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    gradeRange: "Primary"
  },
  {
    id: 20,
    text: "The moon has moonquakes. They are caused by the gravitational pull of the Earth.",
    image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?auto=format&fit=crop&w=800&q=80",
    category: "Space",
    gradeRange: "Secondary"
  }
];