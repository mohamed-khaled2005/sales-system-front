export type Role = "admin"|"ceo"|"sales"|"account_manager"|"content_creator"|"designer"|"video_editor"|"art_director"|"production"|"finance"|"quality"|"hr";
export interface Department { id:number; name:string; slug:string; icon?:string }
export interface User { id:number; name:string; email:string; role:Role; job_title?:string; avatar?:string; target?:number; department?:Department }
export interface Metric { key:string; label:string; value:number; format?:"currency"|"percent"|"score"; change?:number }
export interface DashboardData { scope:string; metrics:Metric[]; pipeline?:{stage:string;count:number;value:number}[]; trend?:{month:string;value:number}[]; cash_flow?:{month:string;value:number}[]; tasks?:{status:string;count:number}[]; clients?:Client[]; review_queue?:Task[]; upcoming?:Task[]; overdue?:Invoice[]; employees?:EmployeePerformance[] }
export interface Lead { id:number; name:string; company?:string; email?:string; phone?:string; source?:string; stage:string; temperature:"hot"|"warm"|"cold"; estimated_value:number; probability:number; next_follow_up_at?:string; notes?:string; owner?:User }
export interface Package { id:number; name:string; monthly_price:number; reels:number; posts:number; stories:number; extra_services?:string[] }
export interface Subscription { id:number; starts_at:string; ends_at:string; status:string; reels_used:number; posts_used:number; stories_used:number; package:Package }
export interface Client { id:number; name:string; industry?:string; logo?:string; primary_color:string; secondary_color:string; contact_name?:string; contact_email?:string; contact_phone?:string; status:string; health_score:number; account_manager?:User; subscriptions?:Subscription[]; projects?:Project[]; tasks?:Task[] }
export interface Project { id:number; name:string; type:string; status:string; progress:number; priority:string; due_at?:string; client?:Client; account_manager?:User }
export interface Task { id:number; title:string; department:string; type:string; status:string; priority:"low"|"medium"|"high"|"urgent"; objective?:string; buyer_persona?:string; platform?:string; deadline?:string; caption?:string; hashtags?:string; reference_url?:string; metadata?:Record<string,unknown>; client?:Client; project?:Project; assignee?:User; versions?:TaskVersion[]; comments?:TaskComment[]; approvals?:Approval[] }
export interface TaskVersion { id:number; version:number; path:string; notes?:string; status:string; user?:User }
export interface TaskComment { id:number; body:string; is_internal:boolean; created_at:string; user?:User }
export interface Approval { id:number; stage:string; status:string; comment?:string; rating?:number; reviewer?:User }
export interface Invoice { id:number; number:string; issue_date:string; due_date:string; subtotal:number; tax:number; total:number; paid_amount:number; status:string; client?:Client }
export interface ProductionShoot { id:number; title:string; location?:string; scheduled_at:string; team?:string[]; equipment?:string[]; vehicle?:string; status:string; client?:Client; photographer?:User }
export interface EmployeePerformance extends User { tasks_count:number; completed_count:number; late_count:number; quality_score:number }
export interface Paginated<T> { data:T[]; current_page:number; last_page:number; total:number; per_page:number }
