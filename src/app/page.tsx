import { getRepos } from "@/lib/github/repos";
import { ProjectDialogProvider } from "@/components/work/ProjectDialog";
import { SiteShell } from "@/components/layout/SiteShell";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/hero/Hero";
import { SelectedWork } from "@/components/work/SelectedWork";
import { Explorer } from "@/components/explorer/Explorer";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

export const revalidate = 3600;

export default async function Page() {
  const { repos, source, fetchedAt, notice } = await getRepos();

  return (
    <ProjectDialogProvider>
      <SiteShell>
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <About />
          <SelectedWork />
          <Explorer repos={repos} source={source} fetchedAt={fetchedAt} notice={notice} />
          <Experience />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </SiteShell>
    </ProjectDialogProvider>
  );
}
