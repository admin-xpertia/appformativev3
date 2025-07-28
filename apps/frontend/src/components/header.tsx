import { Bell, ChevronDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  user: {
    id: string
    name: string
    avatar: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 frosted-glass text-gray-900 z-50 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Espacio Formativo</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block font-medium">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="frosted-glass">
            <DropdownMenuItem className="text-gray-900 hover:bg-gray-100">Mi Perfil</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 hover:bg-gray-100">Configuración</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 hover:bg-gray-100">Cerrar Sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
