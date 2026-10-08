import { useState } from "react";
import { Star, Search as SearchIcon, Flag, EyeOff, Trash2, MessageSquare, Send } from "lucide-react";

import { reviews as initialReviews, formatDate } from "../data/mockData";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";

const STATUS_COLOR = { Published: "green", Flagged: "yellow", Hidden: "gray" };

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-zinc-700"} />
      ))}
    </div>
  );
}

function Reviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [replyDrafts, setReplyDrafts] = useState({});

  const filterFn = (r, { search, status, rating }) => {
    const matchesSearch =
      !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.branch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || r.status === status;
    const matchesRating = !rating || rating === "All" || String(r.rating) === rating;
    return matchesSearch && matchesStatus && matchesRating;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(reviews, { filterFn, pageSize: 6, sortFn: (a, b) => b.date - a.date });

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  const setStatus = (id, status) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast(`Review ${status.toLowerCase()}`, { type: status === "Flagged" ? "warning" : "info" });
  };

  const deleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast("Review deleted", { type: "info" });
  };

  const submitReply = (id) => {
    const text = replyDrafts[id]?.trim();
    if (!text) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: text } : r)));
    setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
    toast("Reply posted", { description: "Your response is now visible to the customer." });
  };

  const stats = [
    { title: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "orange" },
    { title: "Avg. Rating", value: avgRating, icon: Star, color: "yellow" },
    { title: "Flagged", value: reviews.filter((r) => r.status === "Flagged").length, icon: Flag, color: "red" },
    { title: "Published", value: reviews.filter((r) => r.status === "Published").length, icon: MessageSquare, color: "green" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Reviews" subtitle="Monitor and respond to customer feedback." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} change={null} />
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or branch..." className="sm:w-72" />
          <div className="flex gap-3">
            <Select
              value={filters.rating || "All"}
              onChange={(v) => setFilter("rating", v)}
              className="w-32"
              options={[{ value: "All", label: "All Ratings" }, ...[5, 4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} Stars` }))]}
            />
            <Select
              value={filters.status || "All"}
              onChange={(v) => setFilter("status", v)}
              className="w-36"
              options={[
                { value: "All", label: "All Status" },
                { value: "Published", label: "Published" },
                { value: "Flagged", label: "Flagged" },
                { value: "Hidden", label: "Hidden" },
              ]}
            />
          </div>
        </div>

        {paged.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No reviews found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {paged.map((r) => (
                <div key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        {r.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{r.customer}</p>
                          <span className="text-xs text-slate-400">on {r.branch}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Stars rating={r.rating} />
                          <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{r.comment}</p>

                        {r.reply && (
                          <div className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-slate-700 dark:bg-orange-500/5 dark:text-zinc-300">
                            <p className="mb-1 text-xs font-semibold text-orange-600 dark:text-orange-400">Your reply</p>
                            {r.reply}
                          </div>
                        )}

                        {!r.reply && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              value={replyDrafts[r.id] || ""}
                              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && submitReply(r.id)}
                              placeholder="Write a reply..."
                              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-900"
                            />
                            <Button size="sm" onClick={() => submitReply(r.id)}>
                              <Send size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 pl-13">
                    {r.status !== "Flagged" && (
                      <button
                        onClick={() => setStatus(r.id, "Flagged")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Flag size={12} /> Flag
                      </button>
                    )}
                    {r.status !== "Hidden" && (
                      <button
                        onClick={() => setStatus(r.id, "Hidden")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <EyeOff size={12} /> Hide
                      </button>
                    )}
                    {r.status !== "Published" && (
                      <button
                        onClick={() => setStatus(r.id, "Published")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <MessageSquare size={12} /> Publish
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(r.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={6} />
          </>
        )}
      </Card>
    </div>
  );
}

export default Reviews;
