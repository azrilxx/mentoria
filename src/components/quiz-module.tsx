'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, HelpCircle, ExternalLink } from 'lucide-react';
import { QuizModule } from '@/lib/schemas';

interface QuizModuleProps {
  quiz: QuizModule;
  moduleTitle: string;
  showAnswers?: boolean;
  onComplete?: (correct: boolean) => void;
  className?: string;
}

/**
 * Interactive Quiz Component for Training Modules
 */
export function InteractiveQuiz({ 
  quiz, 
  moduleTitle, 
  showAnswers = false, 
  onComplete,
  className = "" 
}: QuizModuleProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === quiz.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);
    setShowExplanation(true);
    
    if (onComplete) {
      onComplete(correct);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswer('');
    setSubmitted(false);
    setShowExplanation(false);
    setIsCorrect(false);
  };

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Quick Knowledge Check
          {submitted && (
            <Badge variant={isCorrect ? "default" : "destructive"} className="ml-auto">
              {isCorrect ? "Correct" : "Incorrect"}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Module: {moduleTitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{quiz.question}</p>
        </div>

        {/* Answer Options */}
        <RadioGroup 
          value={selectedAnswer} 
          onValueChange={setSelectedAnswer}
          disabled={submitted}
          className="space-y-2"
        >
          {quiz.options.map((option, index) => {
            const optionId = `option-${index}`;
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === quiz.correctAnswer;
            
            let optionStyle = "p-3 rounded-lg border transition-colors";
            if (submitted) {
              if (isCorrectOption) {
                optionStyle += " border-green-500 bg-green-50";
              } else if (isSelected && !isCorrectOption) {
                optionStyle += " border-red-500 bg-red-50";
              } else {
                optionStyle += " border-gray-200 bg-gray-50";
              }
            } else if (isSelected) {
              optionStyle += " border-blue-500 bg-blue-50";
            } else {
              optionStyle += " border-gray-200 hover:border-blue-300";
            }

            return (
              <div key={optionId} className={optionStyle}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem 
                    value={option} 
                    id={optionId}
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor={optionId} 
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    <span className="inline-block w-6 text-center font-bold text-gray-600">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </Label>
                  
                  {/* Show result indicators */}
                  {submitted && (
                    <div className="flex-shrink-0">
                      {isCorrectOption && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!submitted ? (
            <Button 
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Answer
            </Button>
          ) : (
            <Button 
              onClick={resetQuiz}
              variant="outline"
            >
              Try Again
            </Button>
          )}
        </div>

        {/* Explanation Section */}
        {(showExplanation || showAnswers) && (
          <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-0 h-auto font-normal"
              >
                <span className="font-medium">💡 Explanation</span>
                {showExplanation ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-3">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <div className="space-y-2">
                    <p>{quiz.explanation}</p>
                    
                    {quiz.sourceRef && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-700">
                          Source Reference:
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          {quiz.sourceRef.startsWith('http') ? (
                            <a 
                              href={quiz.sourceRef} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {quiz.sourceRef} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-blue-700">{quiz.sourceRef}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Preview Mode Indicator */}
        {showAnswers && !submitted && (
          <div className="text-xs text-gray-500 italic text-center pt-2 border-t">
            Preview Mode - Correct answer: {quiz.correctAnswer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuizSummaryProps {
  quizzes: QuizModule[];
  results?: { correct: boolean; quiz: QuizModule }[];
  className?: string;
}

/**
 * Quiz Summary Component showing overall performance
 */
export function QuizSummary({ quizzes, results, className = "" }: QuizSummaryProps) {
  if (!results || results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-6">
          <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Complete the quizzes to see your results</p>
        </CardContent>
      </Card>
    );
  }

  const correctCount = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  let performanceColor = "text-red-600";
  let performanceBadge = "destructive";
  let performanceText = "Needs Improvement";

  if (percentage >= 80) {
    performanceColor = "text-green-600";
    performanceBadge = "default";
    performanceText = "Excellent";
  } else if (percentage >= 60) {
    performanceColor = "text-yellow-600";
    performanceBadge = "secondary";
    performanceText = "Good";
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Quiz Performance Summary
          <Badge variant={performanceBadge as any}>
            {percentage}% ({correctCount}/{totalCount})
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${performanceColor}`}>
            {percentage}%
          </div>
          <div className={`text-sm ${performanceColor}`}>
            {performanceText}
          </div>
        </div>

        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="flex-1 truncate">
                Quiz {index + 1}: {result.quiz.question.substring(0, 40)}...
              </span>
              {result.correct ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {percentage < 80 && (
          <Alert>
            <AlertDescription>
              Consider reviewing the training materials for topics where you scored incorrectly 
              to improve your understanding before proceeding.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractiveQuiz;