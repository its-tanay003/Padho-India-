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
  }
];