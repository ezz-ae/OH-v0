'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, DollarSign, CheckCircle, XCircle, AlertTriangle, Clock,
  Shield, TrendingUp, MessageSquare, Eye, FileText, User, Filter,
  RefreshCw, ChevronRight, Ban, ThumbsUp, Search, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/client';

interface FinanceVerification {
  id: string;
  order_id: string;
  conversation_id: string | null;
  verification_type: 'payment' | 'fraud' | 'credit' | 'manual';
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'auto_approved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  risk_score: number;
  risk_factors: string[];
  amount: number;
  currency: string;
  payment_method: string | null;
  notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  order?: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    notes: string;
    customer?: {
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
      total_orders: number;
      total_spent: number;
    };
  };
}

export default function FinancePage() {
  const router = useRouter();
  const session = getSession();
  const supabase = createClient();

  const [verifications, setVerifications] = useState<FinanceVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<FinanceVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  async function loadVerifications() {
    setIsLoading(true);
    let query = supabase
      .from('finance_verifications')
      .select('*, order:orders(id, order_number, status, total, notes, customer:customers(first_name, last_name, phone, email, total_orders, total_spent))')
      .eq('org_id', '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setVerifications(data as FinanceVerification[] || []);
    
    if (data && data.length > 0 && !selectedVerification) {
      setSelectedVerification(data[0] as FinanceVerification);
    }
    setIsLoading(false);
  }

  async function approveVerification(id: string) {
    await supabase
      .from('finance_verifications')
      .update({
        status: 'approved',
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || 'Approved',
      })
      .eq('id', id);

    // Update order status
    const ver = verifications.find(v => v.id === id);
    if (ver) {
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', ver.order_id);
    }

    setReviewNotes('');
    loadVerifications();
    setSelectedVerification(null);
  }

  async function rejectVerification(id: string) {
    await supabase
      .from('finance_verifications')
      .update({
        status: 'rejected',
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || 'Rejected',
      })
      .eq('id', id);

    const ver = verifications.find(v => v.id === id);
    if (ver) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('id', ver.order_id);
    }

    setReviewNotes('');
    loadVerifications();
    setSelectedVerification(null);
  }

  async function escalateVerification(id: string) {
    await supabase
      .from('finance_verifications')
      .update({ status: 'escalated', priority: 'urgent' })
      .eq('id', id);
    loadVerifications();
  }

  const filteredVerifications = verifications.filter(v => {
    if (!searchQuery) return true;
    const orderNum = v.order?.order_number?.toLowerCase() || '';
    const customerName = `${v.order?.customer?.first_name} ${v.order?.customer?.last_name}`.toLowerCase();
    return orderNum.includes(searchQuery.toLowerCase()) || customerName.includes(searchQuery.toLowerCase());
  });

  const stats = {
    pending: verifications.filter(v => v.status === 'pending').length,
    pendingValue: verifications.filter(v => v.status === 'pending').reduce((sum, v) => sum + v.amount, 0),
    approvedToday: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
    highRisk: verifications.filter(v => v.risk_score > 0.7).length,
  };

  function formatRelativeTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function getRiskColor(score: number) {
    if (score < 0.3) return 'text-green-500';
    if (score < 0.6) return 'text-amber-500';
    return 'text-red-500';
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/house')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-serif font-medium flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Finance Verification
            </h1>
            <p className="text-sm text-muted-foreground">Order payment approval queue</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">AED {stats.pendingValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stats.pending} pending</p>
            </div>
            <Badge variant="secondary">{session.user.name}</Badge>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-2 flex items-center gap-6 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm"><strong>{stats.pending}</strong> pending</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm"><strong>{stats.approvedToday}</strong> approved</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm"><strong>{stats.rejected}</strong> rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm"><strong>{stats.highRisk}</strong> high risk</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Verification List */}
        <div className="w-96 border-r border-border flex flex-col bg-card/30">
          {/* Search & Filters */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 flex-1"
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No verifications found
              </div>
            ) : (
              filteredVerifications.map((ver) => (
                <button
                  key={ver.id}
                  onClick={() => setSelectedVerification(ver)}
                  className={cn(
                    'w-full p-4 text-left border-b border-border/50 hover:bg-muted/50 transition-colors',
                    selectedVerification?.id === ver.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-sm font-medium">{ver.order?.order_number}</span>
                      <Badge className={cn('ml-2 text-[10px]', getPriorityColor(ver.priority))}>
                        {ver.priority}
                      </Badge>
                    </div>
                    <Badge
                      variant={ver.status === 'pending' ? 'secondary' : ver.status === 'approved' ? 'default' : 'destructive'}
                      className="text-[10px]"
                    >
                      {ver.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    {ver.order?.customer?.first_name} {ver.order?.customer?.last_name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold">AED {ver.amount.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(ver.created_at)}</span>
                  </div>
                  {ver.risk_score > 0.5 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Shield className={cn('w-3 h-3', getRiskColor(ver.risk_score))} />
                      <span className={cn('text-xs', getRiskColor(ver.risk_score))}>
                        Risk: {Math.round(ver.risk_score * 100)}%
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Verification Detail */}
        {selectedVerification ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="px-6 py-4 border-b border-border bg-card/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-mono font-bold">{selectedVerification.order?.order_number}</h2>
                    <Badge className={cn(getPriorityColor(selectedVerification.priority))}>
                      {selectedVerification.priority}
                    </Badge>
                    <Badge variant={selectedVerification.status === 'pending' ? 'secondary' : selectedVerification.status === 'approved' ? 'default' : 'destructive'}>
                      {selectedVerification.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedVerification.verification_type} verification · Created {formatRelativeTime(selectedVerification.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">AED {selectedVerification.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{selectedVerification.currency}</p>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Customer
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-medium">
                        {selectedVerification.order?.customer?.first_name} {selectedVerification.order?.customer?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedVerification.order?.customer?.phone}</p>
                      <p className="text-sm text-muted-foreground">{selectedVerification.order?.customer?.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                        <p className="font-medium">{selectedVerification.order?.customer?.total_orders || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lifetime Value</p>
                        <p className="font-medium">AED {selectedVerification.order?.customer?.total_spent?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    {(selectedVerification.order?.customer?.total_orders || 0) > 3 && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <ThumbsUp className="w-3 h-3 mr-1" /> Trusted Customer
                      </Badge>
                    )}
                  </div>
                </Card>

                {/* Risk Assessment */}
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Risk Assessment
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              selectedVerification.risk_score < 0.3 ? 'bg-green-500' :
                              selectedVerification.risk_score < 0.6 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${selectedVerification.risk_score * 100}%` }}
                          />
                        </div>
                        <span className={cn('font-bold', getRiskColor(selectedVerification.risk_score))}>
                          {Math.round(selectedVerification.risk_score * 100)}%
                        </span>
                      </div>
                    </div>

                    {selectedVerification.risk_factors && selectedVerification.risk_factors.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Risk Factors</p>
                        <div className="space-y-1">
                          {selectedVerification.risk_factors.map((factor, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedVerification.risk_score < 0.3 && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" /> Low Risk - Safe to approve
                      </Badge>
                    )}
                  </div>
                </Card>

                {/* Order Notes */}
                <Card className="p-4 col-span-2">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Order Notes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVerification.order?.notes || selectedVerification.notes || 'No notes available'}
                  </p>
                  {selectedVerification.conversation_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push('/house/whatsapp-desk')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View WhatsApp Conversation
                    </Button>
                  )}
                </Card>
              </div>
            </div>

            {/* Action Bar */}
            {selectedVerification.status === 'pending' && (
              <div className="px-6 py-4 border-t border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Add review notes (optional)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveVerification(selectedVerification.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => rejectVerification(selectedVerification.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => escalateVerification(selectedVerification.id)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                </div>
              </div>
            )}

            {/* Already Reviewed */}
            {selectedVerification.status !== 'pending' && selectedVerification.reviewed_at && (
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {selectedVerification.status === 'approved' ? 'Approved' : 'Rejected'} {formatRelativeTime(selectedVerification.reviewed_at)}
                  {selectedVerification.review_notes && ` — "${selectedVerification.review_notes}"`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a verification to review
          </div>
        )}
      </div>
    </div>
  );
}
