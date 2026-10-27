// data.js: demo data and preset lists, kept apart from app logic so either can change alone.
// Everything here is DEMO content: invented user handles, invented posts, invented like counts.
// School names are real institutions, used only as a pick list (no real people are named).
window.UC_DATA = {
  // Shelf order on the Fridge screen. The brain dump asked for "dairy, meat, etc."
  categories: [
    { id: "dairy", label: "Dairy & eggs" },
    { id: "protein", label: "Meat & protein" },
    { id: "produce", label: "Produce" },
    { id: "pantry", label: "Pantry" },
    { id: "frozen", label: "Frozen" }
  ],

  // The known-ingredient list. Recipes point to these ids; aliases let typed text match them.
  ingredients: [
    { id: "eggs", name: "Eggs", cat: "dairy", alias: ["egg"] },
    { id: "milk", name: "Milk", cat: "dairy", alias: [] },
    { id: "butter", name: "Butter", cat: "dairy", alias: [] },
    { id: "shredded-cheese", name: "Shredded cheese", cat: "dairy", alias: ["cheese", "mozzarella", "cheddar"] },
    { id: "cheese-slices", name: "Cheese slices", cat: "dairy", alias: ["american cheese", "sliced cheese"] },
    { id: "yogurt", name: "Plain yogurt", cat: "dairy", alias: ["yogurt", "greek yogurt", "sour cream"] },
    { id: "chicken-breast", name: "Chicken breast", cat: "protein", alias: ["chicken"] },
    { id: "ground-beef", name: "Ground beef", cat: "protein", alias: ["beef", "hamburger meat"] },
    { id: "bacon", name: "Bacon", cat: "protein", alias: [] },
    { id: "canned-tuna", name: "Canned tuna", cat: "protein", alias: ["tuna"] },
    { id: "tofu", name: "Tofu", cat: "protein", alias: [] },
    { id: "onion", name: "Onion", cat: "produce", alias: ["onions"] },
    { id: "garlic", name: "Garlic", cat: "produce", alias: [] },
    { id: "tomato", name: "Tomatoes", cat: "produce", alias: ["tomato"] },
    { id: "spinach", name: "Spinach", cat: "produce", alias: [] },
    { id: "bell-pepper", name: "Bell pepper", cat: "produce", alias: ["pepper", "peppers", "bell peppers"] },
    { id: "potato", name: "Potato", cat: "produce", alias: ["potatoes"] },
    { id: "banana", name: "Banana", cat: "produce", alias: ["bananas"] },
    { id: "avocado", name: "Avocado", cat: "produce", alias: ["avocados"] },
    { id: "lemon", name: "Lemon", cat: "produce", alias: ["lemons"] },
    { id: "green-onion", name: "Green onion", cat: "produce", alias: ["scallion", "scallions", "green onions"] },
    { id: "rice", name: "Rice", cat: "pantry", alias: [] },
    { id: "pasta", name: "Pasta", cat: "pantry", alias: ["spaghetti", "penne"] },
    { id: "ramen", name: "Ramen packs", cat: "pantry", alias: ["ramen", "instant noodles", "cup noodles"] },
    { id: "bread", name: "Bread", cat: "pantry", alias: [] },
    { id: "tortillas", name: "Tortillas", cat: "pantry", alias: ["tortilla", "wraps"] },
    { id: "peanut-butter", name: "Peanut butter", cat: "pantry", alias: ["pb"] },
    { id: "soy-sauce", name: "Soy sauce", cat: "pantry", alias: ["soy"] },
    { id: "canned-beans", name: "Canned beans", cat: "pantry", alias: ["beans", "black beans"] },
    { id: "oats", name: "Oats", cat: "pantry", alias: ["oatmeal"] },
    { id: "flour", name: "Flour", cat: "pantry", alias: [] },
    { id: "sugar", name: "Sugar", cat: "pantry", alias: [] },
    { id: "baking-powder", name: "Baking powder", cat: "pantry", alias: [] },
    { id: "honey", name: "Honey", cat: "pantry", alias: [] },
    { id: "salsa", name: "Salsa", cat: "pantry", alias: [] },
    { id: "pasta-sauce", name: "Pasta sauce", cat: "pantry", alias: ["marinara", "tomato sauce"] },
    { id: "hot-sauce", name: "Hot sauce", cat: "pantry", alias: ["sriracha"] },
    { id: "frozen-veggies", name: "Frozen veggies", cat: "frozen", alias: ["frozen vegetables", "mixed veggies"] },
    { id: "frozen-dumplings", name: "Frozen dumplings", cat: "frozen", alias: ["dumplings", "potstickers"] },
    { id: "frozen-fries", name: "Frozen fries", cat: "frozen", alias: ["fries"] }
  ],

  // Appliances for the profile. Recipes list every appliance they need (all are required).
  tools: [
    { id: "microwave", name: "Microwave" },
    { id: "stovetop", name: "Stovetop" },
    { id: "oven", name: "Oven" },
    { id: "toaster", name: "Toaster" },
    { id: "air-fryer", name: "Air fryer" },
    { id: "rice-cooker", name: "Rice cooker" },
    { id: "kettle", name: "Kettle" },
    { id: "blender", name: "Blender" }
  ],

  // Spice rack presets for the Me screen. Every recipe lists the seasonings it uses (ids from here).
  seasonings: [
    { id: "salt", name: "Salt" },
    { id: "black-pepper", name: "Black pepper" },
    { id: "garlic-powder", name: "Garlic powder" },
    { id: "onion-powder", name: "Onion powder" },
    { id: "paprika", name: "Paprika" },
    { id: "chili-flakes", name: "Chili flakes" },
    { id: "chili-powder", name: "Chili powder" },
    { id: "cumin", name: "Cumin" },
    { id: "oregano", name: "Oregano" },
    { id: "italian-seasoning", name: "Italian seasoning" },
    { id: "cinnamon", name: "Cinnamon" },
    { id: "ground-ginger", name: "Ground ginger" },
    { id: "everything-bagel", name: "Everything bagel seasoning" },
    { id: "vanilla", name: "Vanilla extract" }
  ],

  // Shown on every recipe so "need" lists stay short and honest about what we assume.
  assumed: "cooking oil and water",

  // Demo recipes. Total time is computed from the step minutes, so the two never disagree.
  recipes: [
    {
      id: "ramen-upgrade", name: "1 a.m. upgraded ramen", diff: "Easy", tools: ["stovetop"],
      need: ["ramen", "eggs"],
      seasonings: ["chili-flakes", "black-pepper"],
      blurb: "The egg turns a snack into a meal.",
      steps: [
        { min: 3, text: "Bring 2 cups of water to a boil in a small pot." },
        { min: 2, text: "Add the noodles and half the seasoning packet." },
        { min: 3, text: "Crack the egg straight in. Don't stir; let it poach." },
        { min: 1, text: "Turn off the heat, stir in the rest of the packet and top with chili flakes and black pepper." }
      ]
    },
    {
      id: "mug-omelet", name: "Microwave mug omelet", diff: "Easy", tools: ["microwave"],
      need: ["eggs", "milk", "shredded-cheese"],
      seasonings: ["salt", "black-pepper", "garlic-powder"],
      blurb: "No pan, no stove, one mug to wash.",
      steps: [
        { min: 1, text: "Rub a little oil or butter inside a big mug." },
        { min: 1, text: "Whisk 2 eggs, a splash of milk, salt, pepper and a pinch of garlic powder in the mug with a fork." },
        { min: 1, text: "Stir in a handful of cheese." },
        { min: 2, text: "Microwave 1 minute, stir, then 30 to 60 seconds more until set." }
      ]
    },
    {
      id: "bean-quesadilla", name: "Bean and cheese quesadilla", diff: "Easy", tools: ["stovetop"],
      need: ["tortillas", "shredded-cheese", "canned-beans", "salsa"],
      seasonings: ["salt", "cumin", "chili-powder"],
      blurb: "A can of beans and the last tortillas, zero dollars spent.",
      steps: [
        { min: 2, text: "Drain and rinse the beans; mash about half of them with a fork and stir in a pinch each of salt, cumin and chili powder." },
        { min: 2, text: "Spread beans and cheese over half a tortilla and fold it closed." },
        { min: 3, text: "Cook in a dry pan over medium heat until golden." },
        { min: 3, text: "Flip and cook until the cheese melts." },
        { min: 1, text: "Cut into wedges and dip in salsa." }
      ]
    },
    {
      id: "egg-fried-rice", name: "Leftover egg fried rice", diff: "Easy", tools: ["stovetop"],
      need: ["rice", "eggs", "frozen-veggies", "soy-sauce"],
      seasonings: ["salt", "black-pepper", "garlic-powder", "ground-ginger"],
      blurb: "Best with cold, day-old cooked rice.",
      steps: [
        { min: 2, text: "Heat a spoonful of oil in a pan over medium-high." },
        { min: 2, text: "Scramble 2 eggs, then push them to the side." },
        { min: 4, text: "Add a handful of frozen veggies with a pinch of garlic powder and ground ginger; cook until hot." },
        { min: 5, text: "Add the cold cooked rice, break up clumps and fry until it crackles." },
        { min: 1, text: "Splash in soy sauce, add salt and pepper to taste and toss everything together." }
      ]
    },
    {
      id: "pb-oats", name: "PB banana microwave oats", diff: "Easy", tools: ["microwave"],
      need: ["oats", "milk", "peanut-butter", "banana"],
      seasonings: ["salt", "cinnamon"],
      blurb: "8 a.m. class fuel in five minutes.",
      steps: [
        { min: 1, text: "Mix half a cup of oats, 1 cup of milk, a pinch of salt and a shake of cinnamon in a big bowl." },
        { min: 2, text: "Microwave 2 minutes, stirring halfway so it doesn't boil over." },
        { min: 1, text: "Stir in a spoonful of peanut butter." },
        { min: 1, text: "Slice the banana on top." }
      ]
    },
    {
      id: "tuna-melt", name: "Diner tuna melt", diff: "Easy", tools: ["stovetop"],
      need: ["bread", "canned-tuna", "cheese-slices", "butter"],
      seasonings: ["salt", "black-pepper", "paprika"],
      blurb: "Crispy outside, melty inside.",
      steps: [
        { min: 2, text: "Drain the tuna and mix it with salt, pepper and a pinch of paprika (and mayo if you have it)." },
        { min: 1, text: "Butter one side of two slices of bread." },
        { min: 1, text: "Build it: bread, tuna, cheese, bread, butter sides facing out." },
        { min: 7, text: "Cook on medium, 3 to 4 minutes per side, until golden and melty." }
      ]
    },
    {
      id: "garlic-butter-pasta", name: "Garlic butter pasta", diff: "Easy", tools: ["stovetop"],
      need: ["pasta", "butter", "garlic", "shredded-cheese"],
      seasonings: ["salt", "black-pepper", "chili-flakes", "italian-seasoning"],
      blurb: "Four ingredients that taste like more.",
      steps: [
        { min: 6, text: "Bring a pot of salted water to a boil." },
        { min: 9, text: "Cook the pasta for the time on the package. Save a mug of the pasta water." },
        { min: 2, text: "Melt 2 tablespoons of butter and cook minced garlic with a pinch of chili flakes for 1 minute. Don't let it brown." },
        { min: 2, text: "Toss the pasta with the garlic butter, cheese and a splash of pasta water until glossy. Finish with Italian seasoning, salt and pepper." }
      ]
    },
    {
      id: "honey-garlic-chicken", name: "Honey garlic chicken bowl", diff: "Medium", tools: ["stovetop"],
      need: ["chicken-breast", "rice", "soy-sauce", "honey", "garlic"],
      seasonings: ["salt", "black-pepper", "ground-ginger", "chili-flakes"],
      blurb: "Takeout energy, dorm budget.",
      steps: [
        { min: 2, text: "Start the rice following the package. It cooks while you do the rest." },
        { min: 4, text: "Cut the chicken into bite-size pieces and season with salt and pepper." },
        { min: 8, text: "Brown the chicken in oil over medium-high until no pink is left inside." },
        { min: 3, text: "Stir together 2 tablespoons soy sauce, 1 of honey, minced garlic, a pinch of ground ginger and chili flakes. Pour it in and simmer until sticky." },
        { min: 5, text: "Let the rice finish, fluff it and pile the chicken on top." }
      ]
    },
    {
      id: "microwave-potato", name: "Loaded microwave potato", diff: "Easy", tools: ["microwave"],
      need: ["potato", "shredded-cheese", "yogurt", "green-onion"],
      seasonings: ["salt", "black-pepper", "garlic-powder", "paprika"],
      blurb: "A baked potato with no oven.",
      steps: [
        { min: 1, text: "Scrub the potato and poke it all over with a fork." },
        { min: 9, text: "Microwave 5 minutes, flip, then 3 to 5 minutes more until soft." },
        { min: 1, text: "Split it open, season with salt, pepper and garlic powder, add cheese and microwave 30 seconds to melt." },
        { min: 1, text: "Top with a spoonful of plain yogurt, sliced green onion and a dusting of paprika." }
      ]
    },
    {
      id: "taco-skillet", name: "Beef taco skillet", diff: "Medium", tools: ["stovetop"],
      need: ["ground-beef", "onion", "tortillas", "shredded-cheese", "salsa"],
      seasonings: ["salt", "cumin", "chili-powder", "paprika", "garlic-powder"],
      blurb: "Feeds you and whoever smells it.",
      steps: [
        { min: 3, text: "Dice the onion." },
        { min: 8, text: "Brown the beef and onion in a pan, breaking it up, until no pink is left. Stir in salt, cumin, chili powder, paprika and garlic powder." },
        { min: 3, text: "Stir in a few spoonfuls of salsa and simmer." },
        { min: 2, text: "Warm the tortillas in a dry pan, 30 seconds a side." },
        { min: 2, text: "Fill the tortillas and top with cheese." }
      ]
    },
    {
      id: "dumpling-soup", name: "Frozen dumpling soup", diff: "Easy", tools: ["stovetop"],
      need: ["frozen-dumplings", "spinach", "soy-sauce", "garlic"],
      seasonings: ["ground-ginger", "chili-flakes", "black-pepper"],
      blurb: "Freezer dumplings, upgraded.",
      steps: [
        { min: 5, text: "Boil 3 cups of water with minced garlic, a spoonful of soy sauce and a pinch of ground ginger." },
        { min: 7, text: "Add the dumplings and cook for the time on the bag." },
        { min: 1, text: "Stir in a handful of spinach until it wilts." },
        { min: 1, text: "Taste and add more soy sauce, chili flakes or black pepper." }
      ]
    },
    {
      id: "shakshuka", name: "Dorm shakshuka", diff: "Medium", tools: ["stovetop"],
      need: ["eggs", "tomato", "onion", "bell-pepper", "garlic", "bread"],
      seasonings: ["salt", "cumin", "paprika", "chili-flakes"],
      blurb: "Eggs simmered in a quick tomato sauce. Bread for dipping.",
      steps: [
        { min: 6, text: "Dice the onion and pepper, chop the tomatoes and mince the garlic." },
        { min: 6, text: "Cook the onion and pepper in oil over medium until soft." },
        { min: 10, text: "Add the garlic, tomatoes, salt, cumin and paprika. Simmer until saucy." },
        { min: 6, text: "Make 2 wells, crack an egg into each, cover and cook until the whites set." },
        { min: 2, text: "Sprinkle chili flakes over the top, toast the bread and dip." }
      ]
    },
    {
      id: "chicken-parm", name: "Sunday chicken parm", diff: "Hard", tools: ["stovetop", "oven"],
      need: ["chicken-breast", "flour", "eggs", "bread", "pasta-sauce", "shredded-cheese", "pasta"],
      seasonings: ["salt", "black-pepper", "italian-seasoning", "garlic-powder", "oregano"],
      blurb: "Takes a while. Your roommates will owe you.",
      steps: [
        { min: 5, text: "Heat the oven to 425°F and start a pot of salted water." },
        { min: 6, text: "Toast and crush bread into crumbs; mix in Italian seasoning, garlic powder, salt and pepper. Set out bowls of flour, beaten egg and crumbs." },
        { min: 6, text: "Pound the chicken thin, then coat it in flour, egg and crumbs." },
        { min: 6, text: "Pan-fry in oil about 3 minutes per side until golden." },
        { min: 12, text: "Top with sauce, cheese and a pinch of oregano and bake until the chicken reaches 165°F. Cook the pasta meanwhile." },
        { min: 3, text: "Warm extra sauce and serve the chicken over the pasta." }
      ]
    },
    {
      id: "avocado-egg-toast", name: "Avocado toast with a fried egg", diff: "Easy", tools: ["toaster", "stovetop"],
      need: ["bread", "avocado", "eggs", "lemon"],
      seasonings: ["salt", "black-pepper", "chili-flakes", "everything-bagel"],
      blurb: "Brunch without the brunch prices.",
      steps: [
        { min: 3, text: "Toast the bread." },
        { min: 3, text: "Fry an egg in a little oil, about 3 minutes for a runny yolk." },
        { min: 2, text: "Mash the avocado with lemon juice, salt and pepper." },
        { min: 1, text: "Stack it: toast, avocado, egg. Finish with chili flakes or everything bagel seasoning." }
      ]
    },
    {
      id: "pancakes", name: "From-scratch pancakes", diff: "Medium", tools: ["stovetop"],
      need: ["flour", "milk", "eggs", "sugar", "butter", "baking-powder"],
      seasonings: ["salt", "cinnamon", "vanilla"],
      blurb: "Weekend mode, unlocked by flour.",
      steps: [
        { min: 2, text: "Whisk 1 cup flour, 1 tablespoon sugar, 2 teaspoons baking powder, a pinch of salt and a shake of cinnamon." },
        { min: 2, text: "Whisk in 1 cup milk, 1 egg, 2 tablespoons melted butter and a splash of vanilla. Lumps are fine." },
        { min: 2, text: "Heat a buttered pan on medium. Pour about a quarter cup of batter per pancake." },
        { min: 10, text: "Cook in batches: flip when bubbles pop on top, then 1 more minute." }
      ]
    }
  ],

  // DEMO posts for the Feed. Handles are invented; like counts are invented.
  posts: [
    { id: "p1", user: "midnight_noodler", school: "UMass Amherst", recipe: "ramen-upgrade", ago: "2h", likes: 41, caption: "Third ramen this week but the egg makes it a meal." },
    { id: "p2", user: "quadqueen_eats", school: "Boston University", recipe: "bean-quesadilla", ago: "5h", likes: 28, caption: "Can of beans plus the last tortillas. Zero dollars spent." },
    { id: "p3", user: "hotplate_hank", school: "Northeastern University", recipe: "egg-fried-rice", ago: "9h", likes: 63, caption: "Turned two days of leftover rice into dinner for the whole floor." },
    { id: "p4", user: "oatmeal_ollie", school: "UConn", recipe: "pb-oats", ago: "1d", likes: 17, caption: "Microwave only. Made it to my 8 a.m. on time." },
    { id: "p5", user: "sunday_sauce", school: "UMass Amherst", recipe: "chicken-parm", ago: "1d", likes: 88, caption: "Took forever. Worth it. Roommates owe me." },
    { id: "p6", user: "dumplingdan", school: "Penn State", recipe: "dumpling-soup", ago: "2d", likes: 22, caption: "Freezer dumplings got an upgrade tonight." },
    { id: "p7", user: "shak_attack", school: "Ohio State", recipe: "shakshuka", ago: "3d", likes: 35, caption: "First time making this. Way easier than it looks." },
    { id: "p8", user: "potato_pam", school: "UMass Amherst", recipe: "microwave-potato", ago: "4d", likes: 19, caption: "Loaded potato in 12 minutes, no oven in my dorm." }
  ],

  // DEMO comments on the demo posts. Handles are invented.
  comments: {
    p1: [
      { user: "ramen_ranger", text: "The egg trick is elite. Doing this tonight.", ago: "1h" },
      { user: "late_night_lou", text: "Add a slice of cheese on top, trust me.", ago: "40m" }
    ],
    p3: [{ user: "wok_this_way", text: "Cold rice is the secret. Fresh rice gets mushy.", ago: "6h" }],
    p5: [
      { user: "sauce_boss", text: "Okay this looks better than the dining hall version.", ago: "20h" },
      { user: "midnight_noodler", text: "How long did the whole thing take?", ago: "18h" }
    ]
  },

  // Pick list for the profile's school field (free text is also allowed).
  schools: [
    "UMass Amherst", "UMass Boston", "UMass Lowell", "UMass Dartmouth", "Amherst College",
    "Smith College", "Mount Holyoke College", "Hampshire College", "Boston University",
    "Boston College", "Northeastern University", "Tufts University", "UConn", "Penn State", "Ohio State"
  ],

  // A believable starter fridge for the "Load a sample fridge" button.
  sampleFridge: ["eggs", "milk", "shredded-cheese", "tortillas", "canned-beans", "salsa", "ramen",
    "rice", "soy-sauce", "frozen-veggies", "bread", "peanut-butter", "banana", "oats", "garlic"]
};
