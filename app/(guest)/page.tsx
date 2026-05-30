import {
	ArrowRight,
	BarChart3,
	Building2,
	CheckCircle2,
	GraduationCap,
	Layers3,
	LockKeyhole,
	MessagesSquare,
	ShieldCheck,
	Sparkles,
	UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Kwara Undergraduate Admission Portal",
	description:
		"A modern multi-college admissions and school operations platform for students, staff, college admins, and superadmins.",
};

const navItems = [
	{ label: "Student Registration", href: "/apply" },
	{ label: "Student Login", href: "/signin" },
	{ label: "Staff Login", href: "/staff/signin" },
	{ label: "About", href: "#about" },
	{ label: "Contact", href: "#contact" },
];

const platformStats = [
	{ value: "4", label: "Role dashboards" },
	{ value: "Multi", label: "College ready" },
	{ value: "RBAC", label: "Dynamic access" },
];

const modules = [
	{
		icon: Building2,
		title: "College Management",
		description:
			"Create colleges, assign college admins, and keep every record scoped to its institution.",
	},
	{
		icon: UsersRound,
		title: "Role-Based Staff Access",
		description:
			"College admins can create local roles, assign permissions, and control module actions.",
	},
	{
		icon: GraduationCap,
		title: "Student Admissions",
		description:
			"Applicants can register, select programmes, pay fees, and continue into their student dashboard.",
	},
	{
		icon: BarChart3,
		title: "Reports and Analytics",
		description:
			"Superadmins see combined insights while college admins review only their own college data.",
	},
];

const workflowItems = [
	"Student registration and payment",
	"College admin staff and course setup",
	"Dynamic menu and action permissions",
	"Reports separated by college scope",
];

export default function LandingPage() {
	return (
		<main className="min-h-dvh bg-[#f3f7fc] text-[#06183a]">
			<header className="landing-header">
				<div className="landing-container flex items-center justify-between gap-6 py-4">
					<Link href="/" className="flex items-center gap-3">
						<span className="landing-logo">
							<GraduationCap className="size-6" />
						</span>
						<span>
							<span className="block text-lg font-black leading-none text-white">
								REGISTRATION
							</span>
							<span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#E4A11B] sm:text-xs">
								Kwara State Admission Portal
							</span>
						</span>
					</Link>

					<nav className="hidden items-center gap-1 lg:flex">
						{navItems.map((item) => (
							<Link key={item.href} href={item.href} className="landing-nav-link">
								{item.label}
							</Link>
						))}
					</nav>

					<Link href="/apply" className="landing-primary-action hidden sm:inline-flex">
						Start Admission
						<ArrowRight className="size-4" />
					</Link>
				</div>
			</header>

			<section className="landing-hero">
				<div className="landing-container grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(30rem,1.05fr)] lg:py-16 xl:py-20">
					<div className="landing-reveal">
						<div className="landing-pill w-fit">
							<Sparkles className="size-4" />
							2026 / 2027 admission cycle
						</div>
						<h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl xl:text-6xl">
							A refined school portal for{" "}
							<span className="text-[#E4A11B]">multi-college</span> admissions
							and operations.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-8 text-[#b5c7df] sm:text-lg">
							One elegant platform for applicants, students, staff, college
							admins, and superadmins, with tenant-aware dashboards and reusable
							role-based permissions.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Link href="/apply" className="landing-hero-button">
								<GraduationCap className="size-5" />
								Student Registration
							</Link>
							<Link href="/signin" className="landing-hero-button landing-hero-button-light">
								Student Login
							</Link>
							<Link href="/staff/signin" className="landing-hero-button landing-hero-button-ghost">
								<Building2 className="size-5" />
								Staff Login
							</Link>
						</div>

						<div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
							{platformStats.map((stat) => (
								<div key={stat.label} className="landing-stat">
									<strong>{stat.value}</strong>
									<span>{stat.label}</span>
								</div>
							))}
						</div>
					</div>

					<div className="landing-visual" aria-label="Portal dashboard preview">
						<div className="landing-visual-glow" />
						<div className="landing-browser">
							<div className="landing-browser-top">
								<span />
								<span />
								<span />
								<p>iums.portal</p>
							</div>
							<div className="landing-dashboard-preview">
								<aside>
									<div className="landing-preview-badge">Superadmin</div>
									<div className="landing-preview-menu active">Overview</div>
									<div className="landing-preview-menu">Colleges</div>
									<div className="landing-preview-menu">Roles</div>
									<div className="landing-preview-menu">Reports</div>
								</aside>
								<section>
									<div className="landing-preview-kpis">
										<div><span>Colleges</span><strong>02</strong></div>
										<div><span>Students</span><strong>12.4k</strong></div>
										<div><span>Revenue</span><strong>84.6M</strong></div>
									</div>
									<div className="landing-chart-card">
										<div className="landing-chart-header">
											<span>Admissions trend</span>
											<strong>+18%</strong>
										</div>
										<div className="landing-chart-bars">
											<i className="h-[42%]" />
											<i className="h-[56%]" />
											<i className="h-[48%]" />
											<i className="h-[74%]" />
											<i className="h-[66%]" />
											<i className="h-[86%]" />
										</div>
									</div>
									<div className="landing-preview-list">
										<div><CheckCircle2 className="size-4" /> Payment verified</div>
										<div><ShieldCheck className="size-4" /> Tenant scope active</div>
									</div>
								</section>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="about" className="landing-section">
				<div className="landing-container">
					<div className="landing-section-heading">
						<p>Platform Foundation</p>
						<h2>Built for schools that need clean access, clear data, and fast workflows.</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						{modules.map((module) => {
							const Icon = module.icon;
							return (
								<article key={module.title} className="landing-module-card">
									<div className="landing-module-icon">
										<Icon className="size-5" />
									</div>
									<h3>{module.title}</h3>
									<p>{module.description}</p>
								</article>
							);
						})}
					</div>
				</div>
			</section>

			<section className="landing-section pt-0">
				<div className="landing-container grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
					<div className="landing-dark-card">
						<p className="landing-kicker">Why this architecture works</p>
						<h2>Every user sees only the college, menu, and actions they are allowed to use.</h2>
						<p>
							The application is ready for Strapi-backed tenancy, dynamic RBAC,
							and scoped dashboards without creating a separate template for every
							role.
						</p>
					</div>
					<div className="landing-workflow-card">
						{workflowItems.map((item, index) => (
							<div key={item} className="landing-workflow-item">
								<span>{index + 1}</span>
								<p>{item}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="contact" className="landing-contact">
				<div className="landing-container grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
					<div>
						<p className="landing-kicker">Contact Admissions</p>
						<h2>Ready for the next intake cycle.</h2>
						<p>
							Use the registration path for applicants, or staff access for
							internal college operations and approvals.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Link href="/apply" className="landing-contact-action">
							<Layers3 className="size-5" />
							Start Registration
						</Link>
						<Link href="/staff/signin" className="landing-contact-action secondary">
							<LockKeyhole className="size-5" />
							Staff Access
						</Link>
					</div>
				</div>
			</section>

			<footer className="border-t border-[#dce6f2] bg-white">
				<div className="landing-container flex flex-col gap-3 py-6 text-sm text-[#587091] sm:flex-row sm:items-center sm:justify-between">
					<p>© 2026 Kwara State Undergraduate Admission Portal.</p>
					<p className="inline-flex items-center gap-2">
						<MessagesSquare className="size-4" />
						Admissions support and institutional access
					</p>
				</div>
			</footer>
		</main>
	);
}
