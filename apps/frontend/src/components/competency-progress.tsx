import { Trophy, Medal, Award, Crown } from "lucide-react"

interface CompetencyProgressProps {
  name: string
  progress: number
  level: string
}

const levelIcons = {
  bronce: Medal,
  plata: Trophy,
  oro: Award,
  platino: Crown,
}

const levelColors = {
  bronce: "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
  plata: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  oro: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900",
  platino: "bg-gradient-to-r from-gray-300 to-gray-200 text-gray-900",
}

export function CompetencyProgress({ name, progress, level }: CompetencyProgressProps) {
  const LevelIcon = levelIcons[level as keyof typeof levelIcons]

  return (
    <div className="card-elevated p-6 rounded-2xl hover:scale-105 transition-all duration-300 group">
      <div className="text-center space-y-4">
        <h3 className="font-medium text-gray-900 text-sm leading-tight group-hover:text-mint-dark transition-colors">
          {name}
        </h3>

        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${levelColors[level as keyof typeof levelColors]} shadow-lg`}
        >
          <LevelIcon className="w-4 h-4 mr-2" />
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </div>
      </div>
    </div>
  )
}
