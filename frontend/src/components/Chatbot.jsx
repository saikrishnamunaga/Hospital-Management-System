import React, { useState, useRef, useEffect } from 'react'

// Simple disease information database
const diseaseInfo = {
  'common cold': {
    description: 'A viral infection of the upper respiratory tract',
    symptoms: 'Runny nose, sore throat, cough, sneezing',
    treatment: 'Rest, fluids, over-the-counter medications',
    severity: 'mild'
  },
  'flu': {
    description: 'Influenza - a viral infection causing fever and body aches',
    symptoms: 'Fever over 100°F, chills, muscle aches, cough, fatigue',
    treatment: 'Antiviral drugs (if prescribed), rest, fluids',
    severity: 'moderate'
  },
  'fever': {
    description: 'Elevated body temperature',
    symptoms: 'High temperature, sweating, chills, headache',
    treatment: 'Antipyretics, fluids, rest',
    severity: 'mild'
  },
  'hypertension': {
    description: 'High blood pressure condition',
    symptoms: 'Often asymptomatic, headaches, shortness of breath',
    treatment: 'Lifestyle changes, medications',
    severity: 'moderate'
  },
  'diabetes': {
    description: 'Chronic condition affecting blood sugar',
    symptoms: 'Increased thirst, frequent urination, fatigue, slow healing',
    treatment: 'Lifestyle changes, medications, monitoring',
    severity: 'moderate'
  },
  'migraine': {
    description: 'Severe recurring headache',
    symptoms: 'Throbbing pain, nausea, sensitivity to light/sound',
    treatment: 'Pain relievers, preventive medications',
    severity: 'moderate'
  },
  'asthma': {
    description: 'Chronic airway inflammation',
    symptoms: 'Wheezing, shortness of breath, chest tightness, coughing',
    treatment: 'Inhalers, medications, avoiding triggers',
    severity: 'moderate'
  },
  'back pain': {
    description: 'Pain in the back region',
    symptoms: 'Dull or sharp pain, limited mobility',
    treatment: 'Rest, physical therapy, medications',
    severity: 'mild'
  },
  'acne': {
    description: 'Skin condition with pimples',
    symptoms: 'Pimples, blackheads, whiteheads, oily skin',
    treatment: 'Topical medications, antibiotics, lifestyle changes',
    severity: 'mild'
  },
  'depression': {
    description: 'Mental health disorder with persistent sadness',
    symptoms: 'Persistent sadness, loss of interest, fatigue, changes in appetite',
    treatment: 'Therapy, medications, lifestyle changes',
    severity: 'moderate'
  },
  'anxiety': {
    description: 'Mental health condition with excessive worry',
    symptoms: 'Worry, restlessness, rapid heartbeat',
    treatment: 'Therapy, medications, relaxation techniques',
    severity: 'moderate'
  },
  'uti': {
    description: 'Urinary tract infection',
    symptoms: 'Burning urination, frequent urination, cloudy urine',
    treatment: 'Antibiotics, increased fluid intake',
    severity: 'mild'
  },
  'gastritis': {
    description: 'Stomach lining inflammation',
    symptoms: 'Stomach pain, nausea, vomiting, indigestion',
    treatment: 'Antacids, avoid irritants, medications',
    severity: 'mild'
  },
  'gerd': {
    description: 'Chronic acid reflux disease',
    symptoms: 'Heartburn, acid regurgitation, chronic cough',
    treatment: 'Lifestyle changes, medications',
    severity: 'mild'
  }
}

// General health advice
const healthAdvice = {
  'exercise': 'Regular physical activity is important. Aim for at least 30 minutes of moderate exercise daily.',
  'diet': 'Eat a balanced diet rich in fruits, vegetables, whole grains, and lean proteins. Stay hydrated!',
  'sleep': 'Adults need 7-9 hours of sleep per night for optimal health.',
  'stress': 'Practice stress management techniques like meditation, deep breathing, or yoga.',
  'water': 'Drink at least 8 glasses of water daily for good health.',
  'vaccine': 'Stay up to date with vaccinations to prevent diseases.',
  'checkup': 'Regular health checkups are important for early detection of health issues.'
}

// Symptom checker responses
const symptomResponses = {
  'headache': 'Headaches can have many causes. Try resting in a quiet, dark room. If severe or persistent, consult a doctor.',
  'fever': 'Fever is often a sign of infection. Stay hydrated and rest. Seek medical attention if fever exceeds 103°F or persists.',
  'cough': 'For cough, stay hydrated and use humidifier. Consult a doctor if cough persists more than 2 weeks.',
  'stomach': 'Stomach issues can be from various causes. Try bland diet and small meals. Seek medical help if severe.',
  'chest pain': 'Chest pain should be taken seriously. Seek immediate medical attention if accompanied by shortness of breath.',
  'breathing': 'Difficulty breathing is serious. Seek immediate medical attention.',
  'rash': 'Skin rashes can have many causes. Avoid scratching and consult a dermatologist if persistent.'
}

export default function Chatbot({ token }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! I am your Health Assistant. How can I help you today? You can ask me about:\n- Symptoms and diseases\n- Treatment information\n- General health advice\n- When to see a doctor' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findDiseaseInfo = (query) => {
    const lowerQuery = query.toLowerCase()
    
    // Check for disease info
    for (const [disease, info] of Object.entries(diseaseInfo)) {
      if (lowerQuery.includes(disease)) {
        return info
      }
    }
    
    // Check for symptom responses
    for (const [symptom, response] of Object.entries(symptomResponses)) {
      if (lowerQuery.includes(symptom)) {
        return { description: response, severity: 'info' }
      }
    }
    
    // Check for health advice
    for (const [topic, advice] of Object.entries(healthAdvice)) {
      if (lowerQuery.includes(topic)) {
        return { description: advice, severity: 'info' }
      }
    }
    
    return null
  }

  const getBotResponse = (query) => {
    const lowerQuery = query.toLowerCase()
    
    // Greetings
    if (lowerQuery.match(/^(hi|hello|hey|greetings)/)) {
      return "Hello! I'm your Health Assistant. How can I help you today?"
    }
    
    // Thanks
    if (lowerQuery.includes('thank')) {
      return "You're welcome! Feel free to ask if you have any other health questions."
    }
    
    // Help
    if (lowerQuery.includes('help')) {
      return "I can help you with:\n- Information about diseases and conditions\n- Symptom guidance\n- Treatment information\n- General health advice\n\nJust describe your symptoms or ask about a condition!"
    }
    
    // Check for disease/symptom info
    const info = findDiseaseInfo(query)
    if (info) {
      let response = info.description + '\n\n'
      if (info.symptoms && info.symptoms !== 'info') {
        response += 'Symptoms: ' + info.symptoms + '\n\n'
      }
      if (info.treatment) {
        response += 'Treatment: ' + info.treatment + '\n\n'
      }
      if (info.severity && info.severity !== 'info') {
        response += 'Severity: ' + info.severity.toUpperCase() + '\n\n'
      }
      response += 'Note: This is for informational purposes only. Always consult a healthcare professional for proper diagnosis and treatment.'
      return response
    }
    
    // General health questions
    if (lowerQuery.includes('how to') || lowerQuery.includes('what is') || lowerQuery.includes('why')) {
      return "I'm here to help with health-related questions. Please describe your symptoms or ask about a specific condition. For medical emergencies, please call emergency services immediately!"
    }
    
    // Emergency warning
    if (lowerQuery.includes('emergency') || lowerQuery.includes('severe') || lowerQuery.includes('heart attack') || lowerQuery.includes('stroke')) {
      return "If you're experiencing a medical emergency, please call your local emergency number immediately or go to the nearest emergency room!"
    }
    
    // Default response
    return "I'm not sure I understand. Could you please describe your symptoms or ask about a specific health condition? For example:\n- What are the symptoms of diabetes?\n- How to treat a cold?\n- What causes headaches?\n\nFor emergencies, please seek immediate medical attention!"
  }

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    
    // Simulate bot thinking delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: getBotResponse(inputValue)
      }
      setMessages(prev => [...prev, botResponse])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <span className="chatbot-icon">⚕️</span>
        <span className="chatbot-title">Health Assistant</span>
        <span className="chatbot-status">AI Powered</span>
      </div>
      
      <div className="chatbot-messages">
        {messages.map(message => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-content">
              {message.text.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-bot">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about symptoms, diseases, or health advice..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
          ➤
        </button>
      </div>
    </div>
  )
}
