import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const games = [
    { slug: 'cs2', name: 'Counter-Strike 2' },
    { slug: 'csgo', name: 'Counter-Strike: Global Offensive' },
    { slug: 'valorant', name: 'Valorant' },
    { slug: 'lol', name: 'League of Legends' },
    { slug: 'dota2', name: 'Dota 2' },
    { slug: 'pubg', name: "PlayerUnknown's Battlegrounds" },
    { slug: 'fortnite', name: 'Fortnite' },
    { slug: 'minecraft', name: 'Minecraft' },
    { slug: 'minecraft-java', name: 'Minecraft Java Edition' },
    { slug: 'cod', name: 'Call of Duty: Modern Warfare' },
    { slug: 'bo7', name: 'Call of Duty: Black Ops 7' },
    { slug: 'bo6', name: 'Call of Duty: Black Ops 6' },
    { slug: 'gta5', name: 'Grand Theft Auto V' },
  ]

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    })
  }

  console.log(`Seeded ${games.length} games`)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
