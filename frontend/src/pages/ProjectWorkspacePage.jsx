import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { SimpleStompClient } from '../utils/stomp';
import { 
  Sparkles, 
  Users, 
  CreditCard, 
  CheckSquare, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Lock, 
  Unlock,
  Plus, 
  ChevronRight,
  UserCheck,
  FileText,
  ThumbsUp,
  RotateCcw,
  ExternalLink,
  Check,
  CheckCheck,
  Image as ImageIcon,
  HelpCircle,
  X,
  RefreshCw,
  Download,
  AlertTriangle,
  Briefcase,
  Play,
  UploadCloud,
  Scale,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProjectWorkspacePage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('brief');
  const [project, setProject] = useState(null);
  const [brief, setBrief] = useState(null);
  const [matches, setMatches] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [partnerUser, setPartnerUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Brief Edit State
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editCoreFeatures, setEditCoreFeatures] = useState('');
  const [retryingAi, setRetryingAi] = useState(false);

  // Milestone Form State
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mAmount, setMAmount] = useState('');
  const [mDueDate, setMDueDate] = useState('');
  const [mRevisions, setMRevisions] = useState(2);

  // Deliverables Submission Modal
  const [submittingMilestone, setSubmittingMilestone] = useState(null);
  const [deliverableLinks, setDeliverableLinks] = useState('');
  const [deliverableNote, setDeliverableNote] = useState('');

  // Revision Request Modal
  const [revisionMilestone, setRevisionMilestone] = useState(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  // Dispute Modal
  const [disputeMilestone, setDisputeMilestone] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Admin Dispute Resolution Modal
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [adminDecision, setAdminDecision] = useState('FULL_RELEASE');
  const [adminReason, setAdminReason] = useState('');
  const [splitPercent, setSplitPercent] = useState(60);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState(null);

  // Task Form State
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssigned, setTaskAssigned] = useState('');
  const [taskMilestoneId, setTaskMilestoneId] = useState('');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [chatPage, setChatPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Stripe Checkout Escrow Modal
  const [payingMilestone, setPayingMilestone] = useState(null);
  const [stripeSessionData, setStripeSessionData] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    loadAllProjectData();

    // Listen for Stripe Checkout redirect return
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const paymentStatus = urlParams.get('payment_status');

    if (sessionId && paymentStatus === 'success') {
      verifyAndCaptureStripeSession(sessionId);
    } else if (paymentStatus === 'cancelled') {
      addToast('Stripe Checkout was cancelled. Milestone remains pending funding.', 'info');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === 'chat' && conversation?.id) {
      loadInitialMessages(conversation.id);
      setupWebSocket(conversation.id);
      markConversationRead(conversation.id);
    }
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [activeTab, conversation?.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPartnerTyping, activeTab]);

  const loadAllProjectData = async () => {
    try {
      setLoading(true);
      setError('');
      setIsAccessDenied(false);

      const projRes = await api.get(`/projects/${projectId}`);
      const projData = projRes.data?.data;
      setProject(projData);

      // Load remaining data in parallel
      const [briefRes, milesRes, tasksRes, reviewsRes] = await Promise.all([
        api.get(`/projects/${projectId}/brief`).catch(() => ({ data: { data: null } })),
        api.get(`/projects/${projectId}/milestones`).catch(() => ({ data: { data: [] } })),
        api.get(`/projects/${projectId}/tasks`).catch(() => ({ data: { data: [] } })),
        api.get(`/projects/${projectId}/reviews`).catch(() => ({ data: { data: [] } })),
      ]);

      const briefData = briefRes.data?.data;
      setBrief(briefData);
      if (briefData) {
        setEditSummary(briefData.summary || '');
        setEditSkills((briefData.requiredSkills || []).join(', '));
        setEditCoreFeatures((briefData.coreFeatures || []).join('\n'));
      }

      setMilestones(milesRes.data?.data || []);
      setTasks(tasksRes.data?.data || []);
      setReviews(reviewsRes.data?.data || []);

      if (projData) {
        loadMatches();
        loadProposals();
        loadPartnerAndConversation(projData);
      }

    } catch (err) {
      if (err.response?.status === 403) {
        setIsAccessDenied(true);
        setError(err.response?.data?.message || 'Access denied: This project is in progress with another developer.');
      } else {
        setError(err.response?.data?.message || 'Error loading project workspace.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/matches`);
      if (res.data?.data) {
        const enriched = await Promise.all(
          res.data.data.map(async (m) => {
            try {
              const uRes = await api.get(`/users/${m.developerId}`);
              return { ...m, developer: uRes.data?.data };
            } catch {
              return m;
            }
          })
        );
        setMatches(enriched);
      }
    } catch (err) {
      console.warn('Failed to load matches', err);
    }
  };

  const loadProposals = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/proposals`);
      if (res.data?.data) {
        setProposals(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load proposals', err);
    }
  };

  const loadPartnerAndConversation = async (projData) => {
    const hiredDevId = projData.hiredDeveloperId || projData.selectedDeveloperId;
    if (!hiredDevId) return;

    const isFounder = user?.id === projData.founderId;
    const partnerId = isFounder ? hiredDevId : projData.founderId;

    try {
      const uRes = await api.get(`/users/${partnerId}`);
      if (uRes.data?.data) {
        setPartnerUser(uRes.data.data);
      }
    } catch (e) {
      console.warn('Could not load partner profile', e);
    }

    try {
      const convRes = await api.post('/conversations/initiate', {
        projectId: projData.id,
        developerId: hiredDevId,
        founderId: projData.founderId
      });
      if (convRes.data?.data) {
        setConversation(convRes.data.data);
      }
    } catch (e) {
      console.warn('Chat not ready yet or access restricted', e);
    }
  };

  // Chat WebSocket and Message handling
  const setupWebSocket = (convId) => {
    try {
      if (stompClient) {
        stompClient.disconnect();
      }
      const client = new SimpleStompClient('/ws');
      client.connect({}, () => {
        client.subscribe(`/topic/conversations/${convId}`, (msgPayload) => {
          try {
            const parsed = JSON.parse(msgPayload.body);
            if (parsed.statusUpdate && parsed.messageIds) {
              setMessages((prev) =>
                prev.map((m) =>
                  parsed.messageIds.includes(m.id) ? { ...m, status: 'READ' } : m
                )
              );
            } else {
              setMessages((prev) => {
                if (prev.some((m) => m.id === parsed.id)) return prev;
                return [...prev, parsed];
              });
              markConversationRead(convId);
            }
          } catch (e) {}
        });

        client.subscribe(`/topic/conversations/${convId}/typing`, (typingPayload) => {
          try {
            const data = JSON.parse(typingPayload.body);
            if (data.userId !== user?.id) {
              setIsPartnerTyping(Boolean(data.isTyping));
            }
          } catch (e) {}
        });
      }, () => {
        console.warn('STOMP connect failed; relying on REST API');
      });
      setStompClient(client);
    } catch (e) {
      console.warn('WebSocket STOMP error; REST fallback active', e);
    }
  };

  const loadInitialMessages = async (convId) => {
    try {
      const res = await api.get(`/conversations/${convId}/messages?page=0&size=50`);
      if (res.data?.data) {
        setMessages(res.data.data);
        setChatPage(0);
        setHasMoreMessages(res.data.data.length >= 50);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOlderMessages = async () => {
    if (!conversation?.id || !hasMoreMessages) return;
    try {
      const nextPage = chatPage + 1;
      const res = await api.get(`/conversations/${conversation.id}/messages?page=${nextPage}&size=50`);
      if (res.data?.data && res.data.data.length > 0) {
        setMessages((prev) => [...res.data.data, ...prev]);
        setChatPage(nextPage);
        if (res.data.data.length < 50) {
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markConversationRead = async (convId) => {
    try {
      await api.post(`/conversations/${convId}/read`);
    } catch (e) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !conversation?.id) return;

    if (chatInput.length > 2000) {
      addToast(`Message exceeds maximum 2,000 characters (currently ${chatInput.length})`, 'error');
      return;
    }

    const textToSend = trimmed;
    setChatInput('');
    broadcastTyping(false);

    try {
      const res = await api.post(`/conversations/${conversation.id}/messages`, {
        text: textToSend,
        fileUrl: '',
        fileName: '',
        fileType: 'TEXT'
      });
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      addToast('Failed to send message: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleSendImage = async () => {
    const imageUrl = prompt('Enter Image URL (JPG/PNG/GIF/WebP):', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600');
    if (!imageUrl || !conversation?.id) return;

    const lower = imageUrl.toLowerCase().split('?')[0];
    if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png') && !lower.endsWith('.gif') && !lower.endsWith('.webp')) {
      addToast('Only image files (JPG, PNG, GIF, WebP) are allowed.', 'error');
      return;
    }

    const caption = prompt('Add optional image caption (max 500 chars):', 'UI Mockup Preview') || 'Image attachment';
    if (caption.length > 500) {
      addToast('Caption cannot exceed 500 characters', 'error');
      return;
    }

    try {
      const res = await api.post(`/conversations/${conversation.id}/messages`, {
        text: caption,
        fileUrl: imageUrl,
        fileName: 'preview_mockup.png',
        fileType: 'IMAGE',
        fileSize: 450200 // under 10MB
      });
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      addToast('Failed to send image: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleSendDocument = async () => {
    const fileName = prompt('Enter document name (PDF or ZIP only, e.g. architecture_v1.pdf, codebase.zip):', 'software_specifications.pdf');
    if (!fileName || !conversation?.id) return;

    const lower = fileName.toLowerCase().trim();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.zip')) {
      addToast('Only PDF (.pdf) and ZIP (.zip) files are allowed (max 10 MB)', 'error');
      return;
    }

    try {
      const res = await api.post(`/conversations/${conversation.id}/messages`, {
        text: `Shared deliverable archive: ${fileName}`,
        fileUrl: `https://example.com/docs/${encodeURIComponent(fileName)}`,
        fileName,
        fileType: lower.endsWith('.pdf') ? 'PDF' : 'ZIP',
        fileSize: 1048576 // 1MB, under 10MB limit
      });
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      addToast('Failed to send document: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2500);
  };

  const broadcastTyping = async (isTyping) => {
    if (!conversation?.id) return;
    try {
      if (stompClient?.connected) {
        stompClient.send('/app/chat.typing', {}, JSON.stringify({
          conversationId: conversation.id,
          senderId: user?.id,
          isTyping
        }));
      } else {
        await api.post(`/conversations/${conversation.id}/typing`, { isTyping });
      }
    } catch (e) {}
  };

  // Hiring and Cancelling Hire
  const handleHireDeveloper = async (developerId) => {
    if (!window.confirm('Hire this developer? The project will close for all other developers, set to IN_PROGRESS, and open a private WhatsApp-like chat.')) return;
    try {
      const res = await api.post(`/projects/${projectId}/hire/${developerId}`);
      if (res.data?.data) {
        setProject(res.data.data);
        addToast('Developer hired! Project is now IN_PROGRESS, closed to other developers, and collaboration chat is live.', 'success');
        await loadAllProjectData();
        setActiveTab('milestones');
      }
    } catch (err) {
      addToast('Error hiring developer: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm('Accept this proposal and hire the developer? Other applicants will receive a notification that the project is closed.')) return;
    try {
      const res = await api.post(`/proposals/${proposalId}/accept`);
      if (res.data?.data) {
        addToast('Proposal accepted and developer hired! Project is now IN_PROGRESS.', 'success');
        await loadAllProjectData();
        setActiveTab('milestones');
      }
    } catch (err) {
      addToast('Error accepting proposal: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleCancelHire = async () => {
    if (!window.confirm('Are you sure you want to cancel the hire? The project will return to OPEN status and become visible to all developers again in browse and matching.')) return;
    try {
      const res = await api.post(`/projects/${projectId}/cancel-hire`);
      if (res.data?.data) {
        setProject(res.data.data);
        setConversation(null);
        setPartnerUser(null);
        addToast('Hire cancelled successfully. The project has reopened to all developers.', 'info');
        await loadAllProjectData();
        setActiveTab('matches');
      }
    } catch (err) {
      addToast('Error cancelling hire: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // AI Brief
  const handleRetryAiAnalysis = async () => {
    try {
      setRetryingAi(true);
      const res = await api.post(`/projects/${projectId}/retry-analysis`);
      if (res.data?.data) {
        setBrief(res.data.data);
        setProject((prev) => ({ ...prev, aiAnalysisFailed: false }));
        addToast('AI Technical Brief generated successfully!', 'success');
        await loadMatches();
      }
    } catch (err) {
      addToast('AI Analysis failed again: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setRetryingAi(false);
    }
  };

  const handleSaveBrief = async () => {
    try {
      const skillsArray = editSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const featuresArray = editCoreFeatures.split('\n').map((s) => s.trim()).filter(Boolean);

      const res = await api.put(`/projects/${projectId}/brief`, {
        summary: editSummary,
        requiredSkills: skillsArray,
        coreFeatures: featuresArray,
        suggestedStack: brief?.suggestedStack || [],
        complexity: brief?.complexity || 'Medium',
        suggestedMilestones: brief?.suggestedMilestones || [],
        missingInfoQuestions: brief?.missingInfoQuestions || [],
        confirmedByFounder: true
      });

      if (res.data?.data) {
        setBrief(res.data.data);
        setIsEditingBrief(false);
        loadMatches();
        setProject((prev) => ({ ...prev, status: 'OPEN' }));
        addToast('Brief saved and developer matches recalculated.', 'success');
      }
    } catch (err) {
      addToast('Failed to save brief: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleConfirmAndOpen = async () => {
    try {
      const res = await api.put(`/projects/${projectId}/brief`, {
        ...brief,
        confirmedByFounder: true
      });
      if (res.data?.data) {
        setBrief(res.data.data);
        setProject((prev) => ({ ...prev, status: 'OPEN' }));
        loadMatches();
        setActiveTab('matches');
        addToast('Project published! Ranked developer matches ready.', 'success');
      }
    } catch (err) {
      addToast('Error confirming brief', 'error');
    }
  };

  // ==========================================
  // ESCROW & MILESTONE SYSTEM FLOWS
  // ==========================================

  // Accept Milestone Agreement
  const handleAcceptAgreement = async () => {
    try {
      const res = await api.post(`/projects/${projectId}/milestones/agree`);
      if (res.data?.data) {
        setMilestones(res.data.data);
        addToast('Milestone contract agreement accepted!', 'success');
        loadAllProjectData();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept agreement', 'error');
    }
  };

  // Create Custom Milestone with full validations
  const handleCreateMilestone = async (e) => {
    e.preventDefault();

    const titleTrim = mTitle.trim();
    if (titleTrim.length < 5 || titleTrim.length > 100) {
      addToast(`Milestone title must be between 5 and 100 characters (current: ${titleTrim.length})`, 'error');
      return;
    }

    const descTrim = mDesc.trim();
    if (descTrim.length < 20 || descTrim.length > 1000) {
      addToast(`Deliverables description must be between 20 and 1,000 characters (current: ${descTrim.length})`, 'error');
      return;
    }

    const amountNum = Number(mAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addToast('Milestone amount must be a number greater than 0', 'error');
      return;
    }

    if (!mDueDate) {
      addToast('Milestone due date is required', 'error');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (mDueDate < todayStr) {
      addToast('Milestone due date cannot be a past date', 'error');
      return;
    }

    const revRounds = parseInt(mRevisions, 10);
    if (isNaN(revRounds) || revRounds < 0 || revRounds > 5) {
      addToast('Free revision rounds must be a whole number between 0 and 5', 'error');
      return;
    }

    // Budget match validation
    const targetBudget = Number(project?.budgetMax || project?.budgetMin || 0);
    if (targetBudget > 0 && Math.abs(amountNum - targetBudget) > 1.0) {
      // If adding to existing milestones:
      const existingSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const combinedSum = existingSum + amountNum;
      if (Math.abs(combinedSum - targetBudget) > 1.0 && Math.abs(amountNum - targetBudget) > 1.0) {
        addToast(`Milestone amounts must equal total project budget ($${targetBudget})`, 'error');
        return;
      }
    }

    try {
      const newM = {
        title: titleTrim,
        description: descTrim,
        amount: amountNum,
        dueDate: mDueDate,
        freeRevisionRounds: revRounds
      };
      const res = await api.post(`/projects/${projectId}/milestones`, [newM]);
      if (res.data?.data) {
        setMilestones(res.data.data);
        setShowAddMilestone(false);
        setMTitle('');
        setMDesc('');
        setMAmount('');
        setMDueDate('');
        setMRevisions(2);
        addToast('Milestone created and budget verified! Mutually accept agreement to begin funding.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create milestone', 'error');
    }
  };

  // Fund Milestone (Stripe Checkout)
  const initiateStripePayment = async (milestone) => {
    try {
      setStripeLoading(true);
      const res = await api.post('/payments/stripe/checkout-session', {
        milestoneId: milestone.id
      });
      if (res.data?.data) {
        setPayingMilestone(milestone);
        setStripeSessionData(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to initiate Stripe checkout', 'error');
    } finally {
      setStripeLoading(false);
    }
  };

  const initiatePayment = initiateStripePayment;

  // Server-side verification of Stripe Checkout session return
  const verifyAndCaptureStripeSession = async (sessionId) => {
    try {
      setStripeLoading(true);
      const res = await api.post('/payments/stripe/verify-session', { sessionId });
      if (res.data?.data) {
        addToast('Stripe payment verified & captured! Funds are safely held in platform escrow.', 'success');
        await loadAllProjectData();
      }
    } catch (err) {
      addToast('Payment verification failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setStripeLoading(false);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  // Process Stripe Refund in Test Mode
  const handleStripeRefund = async (milestone) => {
    const reason = window.prompt(`Issue Stripe refund for "${milestone.title}" ($${milestone.amount} USD)? Please enter a reason:`, 'Founder requested refund in test mode');
    if (!reason) return;

    try {
      setStripeLoading(true);
      const res = await api.post('/payments/stripe/refund', {
        milestoneId: milestone.id,
        reason
      });
      if (res.data?.data) {
        addToast(`Milestone '${milestone.title}' was successfully refunded via Stripe!`, 'success');
        await loadAllProjectData();
      }
    } catch (err) {
      addToast('Refund failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setStripeLoading(false);
    }
  };

  // Developer Starts Work (Enforces FUNDED status)
  const handleStartWork = async (milestoneId) => {
    try {
      const res = await api.post(`/milestones/${milestoneId}/start`);
      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? res.data.data : m)));
        addToast('Work started on milestone! Status is now IN_PROGRESS.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Cannot start work: Ensure milestone is FUNDED first', 'error');
    }
  };

  // Developer Submits Deliverables
  const handleSubmitDeliverables = async (e) => {
    e.preventDefault();
    if (!submittingMilestone) return;

    try {
      const res = await api.post(`/milestones/${submittingMilestone.id}/submit`, {
        deliverables: deliverableLinks,
        note: deliverableNote
      });

      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === submittingMilestone.id ? res.data.data : m)));
        setSubmittingMilestone(null);
        setDeliverableLinks('');
        setDeliverableNote('');
        addToast('Deliverables submitted! 5-day review window started.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Submission failed', 'error');
    }
  };

  // Founder Approves and Releases Payment
  const handleApproveMilestone = async (milestoneId) => {
    if (!window.confirm('Approve deliverables and release payment to the developer? Platform fee (10%) will be deducted automatically.')) return;
    try {
      const res = await api.post(`/milestones/${milestoneId}/approve`);
      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? res.data.data : m)));
        addToast(`Milestone approved! Funds released to developer.`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error releasing payment', 'error');
    }
  };

  // Founder Requests Revision
  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!revisionMilestone || !revisionFeedback.trim()) return;

    try {
      const res = await api.post(`/milestones/${revisionMilestone.id}/revision`, {
        feedback: revisionFeedback
      });
      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === revisionMilestone.id ? res.data.data : m)));
        setRevisionMilestone(null);
        setRevisionFeedback('');
        addToast('Revision feedback sent to developer. One free revision round consumed.', 'info');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error requesting revision', 'error');
    }
  };

  // Raise Dispute
  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeMilestone || !disputeReason.trim()) return;

    try {
      const res = await api.post(`/milestones/${disputeMilestone.id}/dispute`, {
        reason: disputeReason
      });
      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === disputeMilestone.id ? res.data.data : m)));
        setDisputeMilestone(null);
        setDisputeReason('');
        addToast('Dispute opened. Milestone escrow funds are FROZEN pending Admin tribunal adjudication.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to raise dispute', 'error');
    }
  };

  // Admin Dispute Resolution
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!resolvingDispute) return;

    try {
      const res = await api.post(`/milestones/${resolvingDispute.id}/dispute/resolve`, {
        decision: adminDecision,
        reason: adminReason,
        splitPercent: adminDecision === 'SPLIT' ? Number(splitPercent) : null
      });

      if (res.data?.data) {
        setMilestones((prev) => prev.map((m) => (m.id === resolvingDispute.id ? res.data.data : m)));
        setResolvingDispute(null);
        setAdminReason('');
        addToast('Admin dispute decision recorded and executed!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Dispute resolution failed', 'error');
    }
  };

  // Download Receipt
  const handleViewReceipt = async (milestoneId) => {
    try {
      const res = await api.get(`/milestones/${milestoneId}/receipt`);
      if (res.data?.data) {
        setReceiptData(res.data.data);
      }
    } catch (err) {
      addToast('Could not load receipt: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Tasks Kanban
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssigned || user.name,
        milestoneId: taskMilestoneId,
        status: 'TODO'
      });
      if (res.data?.data) {
        setTasks((prev) => [...prev, res.data.data]);
        setShowAddTask(false);
        setTaskTitle('');
        setTaskDesc('');
        addToast('Task created successfully', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add task', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data.data : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Completion & Review
  const handleCompleteProject = async () => {
    if (!window.confirm('Mark this project as COMPLETED? Both founder and developer will be able to leave reviews and ratings.')) return;
    try {
      const res = await api.post(`/projects/${projectId}/complete`);
      if (res.data?.data) {
        setProject(res.data.data);
        setActiveTab('reviews');
        addToast('Project marked as COMPLETED!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error completing project', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      addToast('Rating is compulsory (please choose between 1 and 5 stars)', 'error');
      return;
    }

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      addToast('Review feedback comment is required', 'error');
      return;
    }

    if (trimmedComment.length > 500) {
      addToast(`Review comment cannot exceed 500 characters (currently ${trimmedComment.length})`, 'error');
      return;
    }

    try {
      const res = await api.post(`/projects/${projectId}/reviews`, {
        rating: reviewRating,
        comment: trimmedComment
      });
      if (res.data?.data) {
        setReviews((prev) => [...prev, res.data.data]);
        setReviewComment('');
        addToast('Review submitted and rating updated!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error submitting review', 'error');
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 h-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  // 403 Forbidden Screen for unauthorized developers on IN_PROGRESS projects
  if (isAccessDenied) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xs border border-rose-100">
          <Lock className="w-10 h-10" />
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-widest">
          HTTP 403 Forbidden
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-3">Project Is In Progress</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
          This project has already hired a developer and is currently in progress. As enforced by platform security, this project is closed and no longer accepting other developers.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate('/developer')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
          >
            Return to Developer Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Project Inaccessible</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'This project may have been removed or is inaccessible.'}</p>
        <button
          onClick={() => navigate(user?.role === 'FOUNDER' ? '/founder' : '/developer')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isFounder = user?.id === project.founderId;
  const isHiredDev = user?.id === (project.hiredDeveloperId || project.selectedDeveloperId);
  const isHired = Boolean(project.hiredDeveloperId || project.selectedDeveloperId);
  const isAdmin = user?.role === 'ADMIN';

  // Calculate Payment Summary for Dashboard
  const totalContract = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalFunded = milestones.filter(m => m.status === 'FUNDED' || m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED' || m.status === 'RELEASED').reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalReleased = milestones.filter(m => m.status === 'RELEASED').reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalRemaining = totalContract - totalReleased;
  const isContractLocked = milestones.length > 0 && milestones.every(m => m.locked);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FUNDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">FUNDED IN ESCROW</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">IN PROGRESS</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">WORK SUBMITTED</span>;
      case 'RELEASED':
      case 'APPROVED_RELEASED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">RELEASED ✓</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">DISPUTED (FROZEN)</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">REFUNDED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">PENDING FUNDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* AI Analysis Failure Banner */}
      {project.aiAnalysisFailed && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-900">Analysis failed, try again</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Your entered project data is safe. The AI brief generation encountered a temporary glitch.
              </div>
            </div>
          </div>
          {isFounder && (
            <button
              onClick={handleRetryAiAnalysis}
              disabled={retryingAi}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingAi ? 'animate-spin' : ''}`} />
              {retryingAi ? 'Retrying...' : 'Retry AI Analysis'}
            </button>
          )}
        </div>
      )}

      {/* WORKSPACE HEADER CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {project.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                project.status === 'DISPUTED' ? 'bg-rose-100 text-rose-800' :
                project.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {project.status}
              </span>
              {isHired && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Developer Hired
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.title}
            </h1>
            
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Budget: ${project.budgetMin} - ${project.budgetMax}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                Timeline: {project.timeline}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Escrow Protected via Razorpay (10% platform fee)
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {isFounder && project.status === 'IN_PROGRESS' && (
              <button
                onClick={handleCancelHire}
                className="px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cancel Hire & Re-Open
              </button>
            )}

            {isFounder && project.status === 'IN_PROGRESS' && (
              <button
                onClick={handleCompleteProject}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Project
              </button>
            )}

            {project.status === 'DRAFT' && isFounder && (
              <button
                onClick={handleConfirmAndOpen}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Confirm & Open for Matches
              </button>
            )}
          </div>

        </div>
      </div>

      {/* DASHBOARD PAYMENT SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Contract Value</div>
          <div className="text-2xl font-black text-slate-900">${totalContract}</div>
          <div className="text-[10px] text-slate-500 mt-1">{milestones.length} milestones planned</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Funded in Escrow</div>
          <div className="text-2xl font-black text-indigo-600">${totalFunded}</div>
          <div className="text-[10px] text-indigo-600 mt-1 font-semibold">Held securely in vault</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Released to Developer</div>
          <div className="text-2xl font-black text-emerald-600">${totalReleased}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">10% platform fee applied</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining to Release</div>
          <div className="text-2xl font-black text-slate-700">${totalRemaining}</div>
          <div className="text-[10px] text-slate-400 mt-1">Pending approval</div>
        </div>
      </div>

      {/* WORKSPACE TABS */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto custom-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('brief')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'brief'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Technical Brief
        </button>

        {isFounder && (
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'proposals'
                ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Developer Proposals ({proposals.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'matches'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Developer Matches ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'milestones'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Escrow Milestones ({milestones.length})
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Task Kanban ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'chat'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Real-Time Chat
          {isHired && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-200 text-blue-700 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Star className="w-4 h-4" />
          Reviews ({reviews.length})
        </button>
      </div>

      {/* TAB 1: AI TECHNICAL BRIEF */}
      {activeTab === 'brief' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Auto-Generated Technical Brief</h3>
                  <p className="text-[11px] text-slate-500">Transformed from founder description with required skills matching engine</p>
                </div>
              </div>

              {isFounder && (
                <button
                  onClick={() => setIsEditingBrief(!isEditingBrief)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  {isEditingBrief ? 'Cancel Edit' : 'Edit Brief'}
                </button>
              )}
            </div>

            {isEditingBrief ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Summary</label>
                  <textarea
                    rows={3}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Core MVP Features (one per line)</label>
                  <textarea
                    rows={4}
                    value={editCoreFeatures}
                    onChange={(e) => setEditCoreFeatures(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleSaveBrief}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition"
                  >
                    Save & Re-Score Matches
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Summary</h4>
                  <p className="text-sm text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-100 leading-relaxed">
                    {brief?.summary || 'Brief generation in progress...'}
                  </p>
                </div>

                {/* Missing Information Questions */}
                {brief?.missingInfoQuestions && brief.missingInfoQuestions.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      Clarifications & Missing Info Questions
                    </h4>
                    <p className="text-[11px] text-amber-700 mb-3">
                      The AI identified key scope clarifying questions for the founder:
                    </p>
                    <ul className="space-y-2 text-xs text-amber-900">
                      {brief.missingInfoQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100">
                          <span className="font-bold text-amber-700 shrink-0">Q{idx + 1}:</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Core MVP Features
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {(brief?.coreFeatures || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" /> Version 2.0 Features
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {(brief?.optionalFeatures || []).length > 0 ? (
                        brief.optionalFeatures.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></span>
                            <span>{f}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">No secondary features specified</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(brief?.requiredSkills || []).map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Tech Stack</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(brief?.suggestedStack || []).map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Complexity</h4>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                      brief?.complexity === 'High' ? 'bg-rose-100 text-rose-800' :
                      brief?.complexity === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {brief?.complexity || 'Medium'} Complexity
                    </span>
                  </div>
                </div>

                {isFounder && !brief?.confirmedByFounder && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div>
                      <div className="text-sm font-bold">Review and Confirm Technical Brief</div>
                      <div className="text-xs text-blue-100">Once confirmed, your project becomes OPEN and matching developers will be ranked immediately.</div>
                    </div>
                    <button
                      onClick={handleConfirmAndOpen}
                      className="px-6 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shrink-0 shadow-md transition"
                    >
                      Confirm Brief & Rank Matches
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEVELOPER PROPOSALS */}
      {isFounder && activeTab === 'proposals' && (() => {
        const isProjectHired = Boolean(project.hiredDeveloperId || project.selectedDeveloperId);
        const hiredDevId = project.hiredDeveloperId || project.selectedDeveloperId;
        const displayedProposals = isProjectHired
          ? proposals.filter(p => p.developerId === hiredDevId || p.status === 'ACCEPTED')
          : proposals;

        return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Developer Proposals ({displayedProposals.length})</h3>
              <p className="text-xs text-slate-500">
                {isProjectHired ? 'Accepted proposal for hired developer (other applicant proposals hidden)' : 'Review incoming bids. Hiring closes the project to other developers.'}
              </p>
            </div>
            <button onClick={loadProposals} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {isProjectHired && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Proposal Accepted & Developer Hired</h4>
                  <p className="text-[11px] text-emerald-700">Other candidate proposals are closed and hidden from this view.</p>
                </div>
              </div>
            </div>
          )}

          {displayedProposals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No proposals yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                When developers submit bids and timeline estimates, they will appear here.
              </p>
            </div>
          ) : (
            displayedProposals.map((p) => {
              const isAccepted = p.status === 'ACCEPTED';
              const isClosed = p.status === 'CLOSED_NOT_SELECTED';
              const canHire = project.status === 'OPEN' && p.status === 'PENDING';

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-6 border transition-all duration-200 ${
                    isAccepted ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center">
                        {p.developerName ? p.developerName[0] : 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{p.developerName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAccepted ? 'bg-emerald-100 text-emerald-800' :
                            isClosed ? 'bg-slate-100 text-slate-600' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">Submitted {new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Bid Quote</div>
                        <div className="text-base font-black text-emerald-600">${p.bidAmount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Delivery</div>
                        <div className="text-base font-black text-blue-600">{p.estimatedDays} days</div>
                      </div>
                    </div>
                  </div>

                  <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 mb-4 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Developer Cover Note:</span>
                    {p.coverLetter}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {canHire && (
                      <button
                        onClick={() => handleAcceptProposal(p.id)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept Proposal & Hire
                      </button>
                    )}
                    {isAccepted && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Developer Hired for this project
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        );
      })()}

      {/* TAB 3: DEVELOPER MATCHES */}
      {activeTab === 'matches' && (() => {
        const isProjectHired = Boolean(project.hiredDeveloperId || project.selectedDeveloperId);
        const hiredDevId = project.hiredDeveloperId || project.selectedDeveloperId;
        const displayedMatches = isProjectHired
          ? matches.filter(m => m.developerId === hiredDevId)
          : matches;

        return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Ranked Developer Matches</h3>
              <p className="text-xs text-slate-500">
                {isProjectHired ? 'Hired Developer Match (other candidate profiles hidden)' : 'AI evaluated match scoring (Total Score ≥ 40 points)'}
              </p>
            </div>
            {!isProjectHired && (
              <button onClick={loadMatches} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Re-calculate Matches
              </button>
            )}
          </div>

          {isProjectHired && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Developer Hired — Candidate Roster Closed</h4>
                  <p className="text-[11px] text-slate-500">Other developer profiles are hidden after hiring. Direct collaboration, escrow milestone funding, and task deliverables are active.</p>
                </div>
              </div>
              {isFounder && (
                <button
                  onClick={handleCancelHire}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-xs transition shrink-0"
                >
                  Cancel Hire
                </button>
              )}
            </div>
          )}

          {displayedMatches.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">
                {isProjectHired ? 'Developer Hired' : 'No strong matches yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {isProjectHired 
                  ? 'A developer has been hired for this project. Candidate discovery is closed.'
                  : 'Make sure your technical brief is published and skills are entered.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedMatches.map((m, idx) => {
                const dev = m.developer;
                const isSelected = (project.hiredDeveloperId || project.selectedDeveloperId) === m.developerId;
                const isTopMatch = idx === 0 && !isSelected;

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl p-6 border transition-all duration-200 relative overflow-hidden ${
                      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' :
                      isTopMatch ? 'border-blue-400 ring-2 ring-blue-500/20 shadow-md' :
                      'border-slate-200 hover:-translate-y-1 hover:shadow-md'
                    }`}
                  >
                    {isTopMatch && !isSelected && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                        Best Match
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden ring-2 ring-blue-500/20 shrink-0">
                          <img
                            src={dev?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${dev?.name || 'Dev'}`}
                            alt={dev?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{dev?.name || 'Developer'}</h4>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Hired
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {dev?.yearsOfExperience || 0} yrs exp • ${dev?.expectedRate || 45}/hr
                          </div>
                        </div>
                      </div>

                      {/* SVG Circular Match Ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-blue-600"
                            strokeDasharray={`${Math.round(m.totalScore)}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-black text-slate-900">
                          {Math.round(m.totalScore)}%
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Top Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {(dev?.skills || []).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {isFounder && project.status === 'OPEN' && !isSelected && (
                        <button
                          onClick={() => handleHireDeveloper(m.developerId)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition"
                        >
                          Hire Developer
                        </button>
                      )}
                      {isSelected && (
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* TAB 4: IMPROVED ESCROW-STYLE MILESTONE SYSTEM */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          
          {/* MILESTONE AGREEMENT BANNER */}
          {!isContractLocked ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-900">Milestone Agreement Pending</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Both Founder and Developer must accept the milestone list before work can begin or funds can be deposited.
                  </div>
                </div>
              </div>
              <button
                onClick={handleAcceptAgreement}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Milestone Agreement
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-2xs">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Milestone Contract Mutually Accepted & Locked. Fund-First Rule Active.
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">10% Platform Fee on Release</span>
            </div>
          )}

          {/* MILESTONE ACTIONS HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Escrow Milestone Schedule</h3>
              <p className="text-xs text-slate-500">Fund-first rule enforced: Work starts only after verified escrow deposit</p>
            </div>
            {isFounder && !isContractLocked && (
              <button
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" /> Add Milestone
              </button>
            )}
          </div>

          {/* Add Milestone Modal */}
          {showAddMilestone && (
            <form onSubmit={handleCreateMilestone} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900">Add Milestone Deliverables</div>
                <span className="text-[11px] text-slate-500">
                  Target Budget: ${project?.budgetMax || project?.budgetMin || 0}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Milestone Title <span className="text-rose-500">*</span></label>
                    <span className="text-[10px] text-slate-400">{mTitle.length}/100 (min 5)</span>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={100}
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g. Backend Architecture & MongoDB Schema"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($ USD) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={mAmount}
                    onChange={(e) => setMAmount(e.target.value)}
                    placeholder="e.g. 800"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={mDueDate}
                    onChange={(e) => setMDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Deliverables & Acceptance Scope <span className="text-rose-500">*</span></label>
                    <span className="text-[10px] text-slate-400">{mDesc.length}/1000 (min 20)</span>
                  </div>
                  <textarea
                    rows={2}
                    required
                    minLength={20}
                    maxLength={1000}
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    placeholder="Detail exact criteria, test suites, and repository branches required for escrow release..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Free Revision Rounds (0–5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={mRevisions}
                    onChange={(e) => setMRevisions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          )}

          {/* Milestone List */}
          {milestones.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No milestones agreed yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Founders can add milestones to schedule escrow deposits with Razorpay.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((m, idx) => {
                const canFund = isFounder && (m.status === 'PENDING_FUNDING' || m.status === 'REVISION_REQUESTED');
                const canStartWork = isHiredDev && m.status === 'FUNDED';
                const canSubmit = isHiredDev && (m.status === 'IN_PROGRESS' || m.status === 'REVISION_REQUESTED');
                const canApprove = isFounder && m.status === 'SUBMITTED';
                const canDispute = (isFounder || isHiredDev) && m.status === 'SUBMITTED';
                const canAdminResolve = isAdmin && m.status === 'DISPUTED';

                // Stepper index
                const stepIndex = 
                  m.status === 'RELEASED' ? 4 :
                  m.status === 'SUBMITTED' ? 2 :
                  m.status === 'IN_PROGRESS' ? 1 :
                  m.status === 'FUNDED' ? 0 : -1;

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-all duration-200"
                  >
                    {/* Top Row: Milestone Info & Status Badge */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                          {getStatusBadge(m.status)}
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl">{m.description}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">${m.amount}</div>
                        <div className="text-[10px] text-slate-400">Due: {m.dueDate || 'TBD'}</div>
                      </div>
                    </div>

                    {/* MINI STEPPER TIMELINE */}
                    <div className="py-2 border-y border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <div className={`flex items-center gap-1.5 ${stepIndex >= 0 ? 'text-indigo-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${stepIndex >= 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
                        <span>Funded</span>
                      </div>
                      <div className="flex-1 h-0.5 mx-2 bg-slate-100"></div>
                      <div className={`flex items-center gap-1.5 ${stepIndex >= 1 ? 'text-blue-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${stepIndex >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
                        <span>In Progress</span>
                      </div>
                      <div className="flex-1 h-0.5 mx-2 bg-slate-100"></div>
                      <div className={`flex items-center gap-1.5 ${stepIndex >= 2 ? 'text-purple-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${stepIndex >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</span>
                        <span>Submitted</span>
                      </div>
                      <div className="flex-1 h-0.5 mx-2 bg-slate-100"></div>
                      <div className={`flex items-center gap-1.5 ${stepIndex >= 4 ? 'text-emerald-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${stepIndex >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>4</span>
                        <span>Released</span>
                      </div>
                    </div>

                    {/* 5-DAY REVIEW WINDOW & REVISION ROUNDS NOTICE */}
                    {m.status === 'SUBMITTED' && (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-purple-600" />
                          Review Deadline: {m.reviewDeadline ? new Date(m.reviewDeadline).toLocaleString() : '5 days'}
                          <span className="text-purple-700 font-bold">(Auto-releases if founder does not act)</span>
                        </span>
                        <span className="text-[11px] font-semibold text-purple-700">
                          Revisions: {m.revisionRoundsUsed} / {m.freeRevisionRounds} used
                        </span>
                      </div>
                    )}

                    {/* DISPUTED BANNER */}
                    {m.status === 'DISPUTED' && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Scale className="w-4 h-4 text-rose-600" />
                          Dispute Open: {m.disputeReason} (Funds FROZEN)
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => setResolvingDispute(m)}
                            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] shadow-xs hover:bg-rose-700"
                          >
                            Resolve Tribunal
                          </button>
                        )}
                      </div>
                    )}

                    {/* ACTION BUTTONS ROW */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {m.freeRevisionRounds && (
                          <span>Free Revisions: {m.freeRevisionRounds - (m.revisionRoundsUsed || 0)} rounds left</span>
                        )}
                        {m.status === 'RELEASED' && (
                          <button
                            onClick={() => handleViewReceipt(m.id)}
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Receipt
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* FUND FIRST BUTTON */}
                        {canFund && (
                          <button
                            onClick={() => initiatePayment(m)}
                            disabled={stripeLoading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Fund ${m.amount} in Escrow
                          </button>
                        )}

                        {/* STRIPE TEST REFUND BUTTON */}
                        {(isFounder || isAdmin) && m.status === 'FUNDED' && (
                          <button
                            onClick={() => handleStripeRefund(m)}
                            disabled={stripeLoading}
                            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition flex items-center gap-1.5"
                            title="Refund milestone via Stripe in test mode"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Refund via Stripe
                          </button>
                        )}

                        {/* DEVELOPER: START WORK (FUND FIRST) */}
                        {canStartWork && (
                          <button
                            onClick={() => handleStartWork(m.id)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                          >
                            <Play className="w-4 h-4" />
                            Start Work (Funded)
                          </button>
                        )}

                        {/* DEVELOPER: SUBMIT DELIVERABLES */}
                        {canSubmit && (
                          <button
                            onClick={() => setSubmittingMilestone(m)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" />
                            Submit Work Deliverables
                          </button>
                        )}

                        {/* FOUNDER: APPROVE */}
                        {canApprove && (
                          <>
                            <button
                              onClick={() => handleApproveMilestone(m.id)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve & Release
                            </button>
                            <button
                              onClick={() => setRevisionMilestone(m)}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                            >
                              Request Revision
                            </button>
                          </>
                        )}

                        {/* RAISE DISPUTE */}
                        {canDispute && (
                          <button
                            onClick={() => setDisputeMilestone(m)}
                            className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition flex items-center gap-1"
                          >
                            <Scale className="w-3.5 h-3.5" /> Raise Dispute
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* SUBMIT DELIVERABLES MODAL */}
          {submittingMilestone && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSubmitDeliverables} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Submit Milestone Deliverables</h4>
                  <button type="button" onClick={() => setSubmittingMilestone(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deliverable Files / Links (GitHub PR, Figma, Drive URL)</label>
                  <input
                    type="text"
                    required
                    value={deliverableLinks}
                    onChange={(e) => setDeliverableLinks(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Handover Note & Testing Instructions</label>
                  <textarea
                    rows={3}
                    required
                    value={deliverableNote}
                    onChange={(e) => setDeliverableNote(e.target.value)}
                    placeholder="Describe how to test the deliverable..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSubmittingMilestone(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                    Submit Deliverable
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* REQUEST REVISION MODAL */}
          {revisionMilestone && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleRequestRevision} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Request Revision</h4>
                  <button type="button" onClick={() => setRevisionMilestone(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <p className="text-xs text-slate-500">
                  Explain specifically what adjustments are required. This will consume 1 revision round (Rounds remaining: {revisionMilestone.freeRevisionRounds - revisionMilestone.revisionRoundsUsed}).
                </p>
                <div>
                  <textarea
                    rows={3}
                    required
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder="Detail specific feedback..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setRevisionMilestone(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs">
                    Send Revision Request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RAISE DISPUTE MODAL */}
          {disputeMilestone && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleRaiseDispute} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-rose-600" /> Raise Escrow Dispute
                  </h4>
                  <button type="button" onClick={() => setDisputeMilestone(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs">
                  Opening a dispute freezes the milestone funds immediately. A DevMatch platform admin will review the project brief, milestone deliverables, and chat logs to reach a final decision.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Dispute</label>
                  <textarea
                    rows={3}
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Clearly explain the terms breach or dispute..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setDisputeMilestone(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md">
                    Submit Dispute
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADMIN DISPUTE RESOLUTION MODAL */}
          {resolvingDispute && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <form onSubmit={handleResolveDispute} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Admin Dispute Tribunal Adjudication</h4>
                  <button type="button" onClick={() => setResolvingDispute(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Milestone:</strong> {resolvingDispute.title} (${resolvingDispute.amount})</div>
                  <div><strong>Dispute Reason:</strong> {resolvingDispute.disputeReason}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Tribunal Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FULL_RELEASE', 'FULL_REFUND', 'SPLIT'].map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => setAdminDecision(dec)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                          adminDecision === dec
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {dec.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {adminDecision === 'SPLIT' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Developer Share Percentage: {splitPercent}% (${Math.round(resolvingDispute.amount * (splitPercent / 100))} gross)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={splitPercent}
                      onChange={(e) => setSplitPercent(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adjudication Reason & Justification</label>
                  <textarea
                    rows={3}
                    required
                    value={adminReason}
                    onChange={(e) => setAdminReason(e.target.value)}
                    placeholder="Enter official tribunal reasoning..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setResolvingDispute(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                    Enforce Adjudication
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OFFICIAL RECEIPT MODAL */}
          {receiptData && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">Official Escrow Receipt</span>
                  </div>
                  <button onClick={() => setReceiptData(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt ID:</span>
                    <span className="font-mono font-bold text-slate-900">{receiptData.receiptId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Project:</span>
                    <span className="font-semibold text-slate-900">{receiptData.projectTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Milestone:</span>
                    <span className="font-semibold text-slate-900">{receiptData.milestoneTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Paid by Founder:</span>
                    <span className="font-bold text-slate-900">${receiptData.founderPaidAmount}</span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Platform Fee ({receiptData.platformFeePercent}):</span>
                    <span>-${receiptData.platformFeeAmount}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-emerald-700 font-bold text-sm">
                    <span>Developer Received:</span>
                    <span>${receiptData.developerReceivedAmount}</span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Print / Save Receipt
                </button>
              </div>
            </div>
          )}

          {/* STRIPE ESCROW CHECKOUT MODAL */}
          {payingMilestone && stripeSessionData && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
                      S
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Stripe Escrow Checkout</h4>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Test Mode Only
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { setPayingMilestone(null); setStripeSessionData(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Milestone:</span>
                    <span className="font-bold text-slate-800 max-w-[200px] truncate text-right">{payingMilestone.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Session ID:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[180px]">{stripeSessionData.sessionId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>Escrow Deposit:</span>
                    <span className="text-indigo-600 text-base">${payingMilestone.amount} USD</span>
                  </div>
                </div>

                <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center justify-between text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                      <span>Stripe Test Mode Cards (India Account)</span>
                    </span>
                    <span className="text-[9px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-800 font-bold uppercase tracking-wider">Required</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-tight">
                    Under Indian RBI regulations, this Stripe test account accepts India domestic test cards (US cards like 4242 are blocked):
                  </p>
                  <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70 font-mono text-[11px] space-y-1.5 text-slate-800">
                    <div className="flex justify-between items-center">
                      <span>India Visa: <strong className="text-indigo-600 font-semibold select-all">4000 0035 6000 0008</strong></span>
                      <span className="text-[10px] text-slate-500 font-sans">Exp: 12/28 · CVC: 123</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-amber-100">
                      <span>3DS / OTP: <strong className="text-indigo-600 font-semibold select-all">4000 0000 0000 3220</strong></span>
                      <span className="text-[10px] text-emerald-600 font-bold font-sans">Passes 3DS</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 mb-5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Protected by Escrow Guard</span>
                  </div>
                  <p className="text-[10px] text-blue-700/90 leading-relaxed">
                    Funds are deposited into platform escrow and released only after you test, inspect, and approve the deliverables.
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href={stripeSessionData.checkoutUrl}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Stripe Checkout</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => { setPayingMilestone(null); setStripeSessionData(null); }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 5: TASK KANBAN */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Interactive Kanban Board</h3>
              <p className="text-xs text-slate-500">Track tasks and sprint deliverables across milestones</p>
            </div>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Task Card
            </button>
          </div>

          {showAddTask && (
            <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md space-y-4">
              <div className="text-sm font-bold text-slate-900">Create Task Item</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Integrate Webhook Handlers"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskAssigned}
                    onChange={(e) => setTaskAssigned(e.target.value)}
                    placeholder="Name or Developer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Task details and instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Add Task
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do */}
            <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">To Do</span>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                  {tasks.filter(t => t.status === 'TODO').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'TODO').map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                    <div className="font-bold text-slate-900">{t.title}</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{t.assignedTo || 'Unassigned'}</span>
                      <button
                        onClick={() => handleUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Start →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/70">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">In Progress</span>
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-900 font-bold text-[10px] flex items-center justify-center">
                  {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'IN_PROGRESS').map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs text-xs space-y-2">
                    <div className="font-bold text-slate-900">{t.title}</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{t.assignedTo || 'Unassigned'}</span>
                      <button
                        onClick={() => handleUpdateTaskStatus(t.id, 'DONE')}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Done ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/70">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Done</span>
                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center">
                  {tasks.filter(t => t.status === 'DONE').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'DONE').map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs text-xs space-y-2">
                    <div className="font-bold text-slate-900 line-through text-slate-400">{t.title}</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">
                      <span>{t.assignedTo || 'Completed'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REAL-TIME WHATSAPP-LIKE CHAT */}
      {activeTab === 'chat' && (
        <div className="bg-[#efeae2] rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col h-[650px] relative">
          {!isHired ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Collaboration Chat Locked</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Chat is strictly disabled prior to hiring. Once a Founder accepts a proposal and hires a Developer, private real-time collaboration chat unlocks automatically.
              </p>
              {isFounder && (
                <button
                  onClick={() => setActiveTab('proposals')}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                >
                  Review Developer Proposals & Hire
                </button>
              )}
            </div>
          ) : (
            <>
              {/* WhatsApp Header */}
              <div className="px-6 py-3.5 bg-[#075e54] text-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white/40">
                      <img
                        src={partnerUser?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${partnerUser?.name || 'Partner'}`}
                        alt={partnerUser?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {partnerUser?.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#075e54]"></span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm leading-tight text-white">
                        {partnerUser?.name || (isFounder ? 'Hired Developer' : 'Project Founder')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                        {isFounder ? 'Developer' : 'Founder'}
                      </span>
                    </div>

                    <div className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
                      {isPartnerTyping ? (
                        <span className="text-emerald-200 font-bold flex items-center gap-1 animate-pulse">
                          typing...
                        </span>
                      ) : partnerUser?.online ? (
                        <span className="flex items-center gap-1 text-emerald-200 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span> Online
                        </span>
                      ) : (
                        <span>
                          {partnerUser?.lastSeenAt
                            ? `Last seen ${new Date(partnerUser.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Offline'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendImage}
                    title="Send Image"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Image</span>
                  </button>
                  <button
                    onClick={handleSendDocument}
                    title="Share File"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline">File</span>
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div
                className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)',
                  backgroundSize: '16px 16px'
                }}
              >
                {hasMoreMessages && (
                  <div className="text-center py-2">
                    <button
                      onClick={loadOlderMessages}
                      className="px-4 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 font-bold text-[11px] shadow-xs transition border border-slate-200"
                    >
                      Load older messages
                    </button>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="inline-block px-4 py-2 rounded-xl bg-white/80 backdrop-blur-xs text-xs font-medium text-slate-600 shadow-xs border border-slate-200">
                      🔒 End-to-end workspace collaboration. Send a greeting to initiate conversation.
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderId === user?.id;
                    const currentDate = new Date(m.sentAt).toDateString();
                    const prevDate = idx > 0 ? new Date(messages[idx - 1].sentAt).toDateString() : null;
                    const showDateSeparator = currentDate !== prevDate;

                    return (
                      <React.Fragment key={m.id || idx}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-3">
                            <span className="px-3 py-1 rounded-lg bg-white/90 text-slate-600 text-[10px] font-bold shadow-xs uppercase tracking-wider border border-slate-200">
                              {currentDate === new Date().toDateString() ? 'Today' : currentDate}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-md sm:max-w-lg p-3 rounded-2xl text-xs shadow-xs relative space-y-1.5 ${
                              isMe
                                ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                                : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                            }`}
                          >
                            {!isMe && (
                              <div className="font-bold text-[10px] text-[#075e54]">
                                {m.senderName || 'Partner'}
                              </div>
                            )}

                            {m.type === 'IMAGE' && m.fileUrl && (
                              <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setShowImageModal(m.fileUrl)}>
                                <img
                                  src={m.fileUrl}
                                  alt={m.fileName || 'Image'}
                                  className="w-full max-h-60 object-cover rounded-xl hover:opacity-95 transition"
                                />
                                {m.text && <p className="mt-1.5 text-xs text-slate-800">{m.text}</p>}
                              </div>
                            )}

                            {m.type === 'FILE' && (
                              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 border border-black/5">
                                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate">{m.fileName || 'document.pdf'}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {m.fileSize ? `${Math.round(m.fileSize / 1024)} KB` : 'Document'}
                                  </div>
                                </div>
                                <a
                                  href={m.fileUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-white text-slate-700 hover:text-blue-600"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            {m.type !== 'IMAGE' && m.type !== 'FILE' && (
                              <p className="leading-relaxed text-slate-800 break-words whitespace-pre-wrap">{m.text}</p>
                            )}

                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-0.5">
                              <span>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && (
                                <span className="inline-flex items-center">
                                  {m.status === 'READ' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" title="Read" />
                                  ) : m.status === 'DELIVERED' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-400" title="Sent" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {isPartnerTyping && (
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-2xl bg-white text-slate-500 text-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[#f0f2f5] border-t border-slate-300 flex items-center gap-2 z-10"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={handleChatInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#075e54] focus:outline-none placeholder-slate-400 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-3 rounded-full bg-[#075e54] hover:bg-[#064e46] disabled:opacity-50 text-white transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {showImageModal && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowImageModal(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                <button onClick={() => setShowImageModal(null)} className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1">
                  <X className="w-6 h-6" />
                </button>
                <img src={showImageModal} alt="Enlarged" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 mb-1">Project Reviews & Ratings</h3>
            <p className="text-xs text-slate-500 mb-6">Verified feedback directly impacts developer matching ranking.</p>

            {project.status === 'COMPLETED' ? (
              <form onSubmit={handleSubmitReview} className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-4 mb-8">
                <div className="text-sm font-bold text-blue-900">Submit Your Review</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Detailed Feedback <span className="text-rose-500">*</span></label>
                    <span className={`text-[10px] font-bold ${reviewComment.length > 500 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {reviewComment.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={500}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe collaboration, milestone communication, and code quality..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {reviewComment.length > 500 && (
                    <p className="text-[11px] text-rose-600 mt-1">Comment cannot exceed 500 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 mb-8">
                Reviews unlock once the project is marked as <strong>COMPLETED</strong>.
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Verified Feedback ({reviews.length})</h4>
              {reviews.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No reviews recorded yet.</div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800">{r.reviewerName || 'Participant'}</div>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                    <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
