"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface Answer {
  id: string
  answer: string
  is_pack_owner: boolean
  created_at: string
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface Question {
  id: string
  question: string
  created_at: string
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  answers: Answer[]
}

interface PackQuestionsProps {
  packId: string
  isAuthenticated: boolean
}

export function PackQuestions({ packId, isAuthenticated }: PackQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [newQuestion, setNewQuestion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answeringTo, setAnsweringTo] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchQuestions()
  }, [packId])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/packs/${packId}/questions`)
      const data = await response.json()
      if (data.success) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      toast({
        title: "Error",
        description: "La pregunta no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/packs/${packId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Pregunta publicada",
          description: "El creador del pack recibirá una notificación",
        })
        setNewQuestion("")
        fetchQuestions()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo publicar la pregunta",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast({
        title: "Error",
        description: "La respuesta no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/packs/${packId}/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Respuesta publicada",
        })
        setAnswerText("")
        setAnsweringTo(null)
        fetchQuestions()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo publicar la respuesta",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-foreground" />
        <h2 className="text-2xl font-black text-foreground">Preguntas y Respuestas</h2>
      </div>

      {isAuthenticated && (
        <Card className="p-6 rounded-2xl border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Hacé una pregunta</h3>
          <div className="space-y-4">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="¿Tenés alguna duda sobre este pack?"
              className="min-h-[100px]"
            />
            <Button onClick={handleSubmitQuestion} disabled={isSubmitting} className="rounded-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                "Publicar Pregunta"
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="p-6 rounded-2xl border-border">
            <div className="flex items-start gap-3 mb-4">
              {question.user.avatar_url ? (
                <img
                  src={question.user.avatar_url || "/placeholder.svg"}
                  alt={question.user.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                  {question.user.username[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-foreground">{question.user.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(question.created_at).toLocaleDateString("es-AR")}
                  </div>
                </div>
                <p className="text-base text-foreground leading-relaxed">{question.question}</p>
              </div>
            </div>

            {question.answers.length > 0 && (
              <div className="ml-13 space-y-3 mb-4">
                {question.answers.map((answer) => (
                  <div key={answer.id} className="bg-accent/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {answer.user.avatar_url ? (
                        <img
                          src={answer.user.avatar_url || "/placeholder.svg"}
                          alt={answer.user.username}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                          {answer.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-sm text-foreground">{answer.user.username}</div>
                          {answer.is_pack_owner && (
                            <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0 rounded-full">
                              Creador
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {new Date(answer.created_at).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{answer.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <div className="ml-13">
                {answeringTo === question.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Escribí tu respuesta..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSubmitAnswer(question.id)} className="rounded-full">
                        Publicar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAnsweringTo(null)
                          setAnswerText("")
                        }}
                        className="rounded-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAnsweringTo(question.id)}
                    className="rounded-full text-sm"
                  >
                    Responder
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <Card className="p-8 rounded-2xl border-border text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isAuthenticated ? "No hay preguntas todavía. Sé el primero en preguntar." : "No hay preguntas todavía."}
          </p>
        </Card>
      )}
    </div>
  )
}
