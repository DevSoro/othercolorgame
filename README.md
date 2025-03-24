# OtherColor - Find the Different Tile

OtherColor is an engaging color perception game that challenges players to identify the tile with a slightly different color shade from a grid of similar-colored tiles.


## Features

- Progressive difficulty: Grid size increases as you advance through stages
- Decreasing color difference between tiles with each stage
- Time-based gameplay with penalties for incorrect selections
- Score system with bonuses for quick answers
- Visually appealing UI with smooth animations using Framer Motion
- Responsive design that works on various screen sizes

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Accessible UI components
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide React](https://lucide.dev/) - Icon library
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation

## Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/othercolor.git
cd othercolor
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## How to Play

1. Start the game by clicking the "Start Game" button
2. Look for the tile with a slightly different color shade and click on it
3. Each correct answer advances you to the next stage with increased difficulty
4. Incorrect answers reduce your remaining time
5. The game ends when the timer reaches zero
6. Try to achieve the highest score possible!

## Game Mechanics

- **Stages**: Each stage increases the grid size (2×2, 3×3, 4×4, etc.)
- **Difficulty**: Color difference between tiles decreases with each stage
- **Scoring**: Points are awarded based on:
  - Current stage value
  - Remaining time bonus
  - Grid complexity factor
- **Time Penalty**: Incorrect selections reduce remaining time

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspiration from various color perception games
- Built with Next.js app router and React 19
- UI components provided by shadcn/ui
