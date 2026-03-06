import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Search, Coins } from "lucide-react";

type Step = "game" | "username" | "device" | "searching" | "found" | "selectAmount" | "transferring" | "failed";
type Tab = "home" | "topEarners" | "partners";

const ROBUX_AMOUNTS = [5000, 10000, 15000, 20000, 25000, 50000];

const BRAINROT_CHARACTERS = [
  { id: "strawberry-elephant", name: "Strawberry Elephant", image: "/brainrot/strawberry_elephant.png", available: true },
  { id: "meowl", name: "Meowl", image: "/brainrot/meowl.png", available: false },
  { id: "dragon-cannelloni", name: "Dragon Cannelonni", image: "/brainrot/dragon_cannelloni.png", available: true },
  { id: "garama", name: "Garama", image: "/brainrot/garama.png", available: true },
];

const ESCAPE_TSUNAMI_CHARACTERS = [
  { id: "cupitron-consoletron", name: "Cupitron Consoletron", image: "/Escape_tsunami_for_brainrots/Cupitron_Consoletron.png", available: true },
  { id: "galactio-fantasma", name: "Galactio Fantasma", image: "/Escape_tsunami_for_brainrots/Galactio_Fantasma.png", available: true },
  { id: "meta-technetta", name: "Meta Technetta", image: "/Escape_tsunami_for_brainrots/Meta_Technetta.png", available: false },
  { id: "strawberry-elephant-tsunami", name: "Strawberry Elephant", image: "/Escape_tsunami_for_brainrots/strawberry_elephant.png", available: true },
];

const DEVICES = [
  { id: "ios", name: "iOS", icon: "🍎" },
  { id: "android", name: "Android", icon: "🤖" },
  { id: "windows", name: "Windows", icon: "🪟" },
];

const TOP_EARNERS = [
  { id: 1, name: "ShadowNinja", value: 12500 },
  { id: 2, name: "CrystalQueen", value: 9800 },
  { id: 3, name: "ThunderBolt", value: 7200 },
  { id: 4, name: "MysticWolf", value: 6500 },
  { id: 5, name: "PhoenixRise", value: 5800 },
  { id: 6, name: "DragonFire", value: 5200 },
  { id: 7, name: "StarGazer", value: 4700 },
  { id: 8, name: "MoonWalker", value: 4200 },
  { id: 9, name: "SunKiller", value: 3800 },
  { id: 10, name: "IceQueen", value: 3400 },
];

const PARTNERS = [
  { id: 1, name: "FaZmash", channel: "FaZmash", subscribers: "582K", games: ["Steal a Brainrot", "Grow a Garden"], avatar: "�" },
  { id: 2, name: "greenlegocats123", channel: "greenlegocats123", subscribers: "628K", games: ["Steal a Brainrot"], avatar: "�" },
  { id: 3, name: "Thijmen0808", channel: "Thijmen0808", subscribers: "521K", games: ["Grow a Garden"], avatar: "🎢" },
  { id: 4, name: "Gullbox Roblox", channel: "Gullbox Roblox", subscribers: "206K", games: ["Steal a Brainrot", "Grow a Garden"], avatar: "🦆" },
  { id: 5, name: "Colbe", channel: "Colbe", subscribers: "256K", games: ["Steal a Brainrot"], avatar: "🎭" },
  { id: 6, name: "Roblox Vídeos - Thomas & Friends", channel: "UCJme9Xb1B", subscribers: "228K", games: ["Grow a Garden"], avatar: "🚂" },
];

const GAMES = [
  { 
    id: "robux", 
    name: "Robux", 
    description: "",
    icon: "/robux/robux.png"
  },
  { 
    id: "steal-brainrot", 
    name: "Steal a Brainrot", 
    description: "",
    icon: "/brainrot/sab.png"
  },
  { 
    id: "escape-tsunami-for-brainrots", 
    name: "Escape Tsunami for Brainrots", 
    description: "",
    icon: "/Escape_tsunami_for_brainrots/etfb.png"
  },
];

const TRANSFER_STEPS = [
  "Locating username...",
  "Connecting to Roblox servers...",
  "Checking account availability...",
  "Verifying user identity...",
  "Confirming account balance...",
  "Validating transfer amount...",
  "Processing transfer request...",
  "Executing Robux transfer...",
  "Confirming transaction completion...",
  "Finalizing delivery...",
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [step, setStep] = useState<Step>("game");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [searchMessage, setSearchMessage] = useState("Searching for user...");
  const [transferIndex, setTransferIndex] = useState(0);
  const [transferStatuses, setTransferStatuses] = useState<("pending" | "loading" | "done" | "failed")[]>(
    TRANSFER_STEPS.map(() => "pending")
  );
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    username: string;
    reward: string;
    timestamp: number;
  }>>([]);
  const [liveUsers, setLiveUsers] = useState(50);
  const [isUsersChanging, setIsUsersChanging] = useState(false);

  // Helper function to mask username
  const maskUsername = (username: string) => {
    if (username.length <= 2) return username;
    const firstTwo = username.substring(0, 2);
    const asterisks = '*'.repeat(username.length - 2);
    return firstTwo + asterisks;
  };

  // Helper function to censor top earners names (more aggressive)
  const censorTopEarnerName = (name: string) => {
    if (name.length <= 3) return name.substring(0, 1) + '*'.repeat(name.length - 1);
    const firstTwo = name.substring(0, 2);
    const lastOne = name.substring(name.length - 1);
    const asterisks = '*'.repeat(name.length - 3);
    return firstTwo + asterisks + lastOne;
  };

  // Helper function to add notification
  const addNotification = (username: string, reward: string) => {
    const notification = {
      id: Date.now().toString(),
      username: maskUsername(username),
      reward,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep only 5 most recent
  };

  // Generate sample notifications periodically
  useEffect(() => {
    const sampleUsers = [
      "Gamer123", "ProPlayer", "RobloxMaster", "CoolKid99", "SuperStar",
      "DiamondUser", "GoldenHero", "SilverKnight", "BronzeKing", "PlatinumQueen"
    ];
    
    const sampleRewards = [
      "5,000 R$", "10,000 R$", "15,000 R$", "20,000 R$", "25,000 R$", "50,000 R$",
      "Strawberry Elephant", "Dragon Cannelonni", "Garama"
    ];

    const generateNotification = () => {
      const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const randomReward = sampleRewards[Math.floor(Math.random() * sampleRewards.length)];
      addNotification(randomUser, randomReward);
    };

    // Generate initial notifications
    setTimeout(generateNotification, 2000);
    setTimeout(generateNotification, 5000);
    setTimeout(generateNotification, 8000);

    // Generate notifications periodically
    const interval = setInterval(generateNotification, 15000 + Math.random() * 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Clean up old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      setNotifications(prev => prev.filter(n => Date.now() - n.timestamp < 30000)); // Remove after 30 seconds
    }, 5000);
    
    return () => clearInterval(cleanup);
  }, []);

  // Randomly fluctuate live users count
  useEffect(() => {
    const updateLiveUsers = () => {
      setLiveUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // Random change between -10 and +10
        const newValue = prev + change;
        
        // Keep within bounds 50-300
        if (newValue < 50) return 50 + Math.floor(Math.random() * 10);
        if (newValue > 300) return 300 - Math.floor(Math.random() * 10);
        return newValue;
      });
      
      // Trigger animation
      setIsUsersChanging(true);
      setTimeout(() => setIsUsersChanging(false), 300);
    };

    // Update every 3-8 seconds randomly
    const scheduleNextUpdate = () => {
      const delay = 3000 + Math.random() * 5000; // 3-8 seconds
      setTimeout(() => {
        updateLiveUsers();
        scheduleNextUpdate();
      }, delay);
    };

    // Start updates after 2 seconds
    const initialTimeout = setTimeout(scheduleNextUpdate, 2000);
    
    return () => clearTimeout(initialTimeout);
  }, []);

  const handleGameSelect = () => {
    if (!selectedGame) return;
    setStep("username");
  };

  const handleFindUser = () => {
    if (!username.trim()) return;
    setStep("device");
  };

  const handleDeviceSelect = () => {
    if (!selectedDevice) return;
    setStep("searching");
    setSearchMessage("Searching for user...");

    setTimeout(() => setSearchMessage("Locating account..."), 1200);
    setTimeout(() => {
      setStep("found");
      setTimeout(() => setStep("selectAmount"), 1500);
    }, 3000);
  };

  const runTransfer = useCallback(() => {
    setStep("transferring");
    setTransferIndex(0);
    
    // Dynamic transfer steps based on game
    const dynamicSteps = selectedGame === "steal-brainrot" 
      ? [
          "Locating username...",
          "Connecting to brain servers...",
          "Checking character availability...",
          "Verifying user identity...",
          "Confirming character access...",
          "Validating steal request...",
          "Processing character transfer...",
          "Executing brainrot steal...",
          "Confirming theft completion...",
          "Finalizing delivery...",
        ]
      : TRANSFER_STEPS;
    
    setTransferStatuses(dynamicSteps.map(() => "pending"));

    const runStep = (i: number) => {
      if (i >= dynamicSteps.length) return;

      setTransferStatuses((prev) => {
        const next = [...prev];
        next[i] = "loading";
        return next;
      });

      setTimeout(() => {
        const isLast = i === dynamicSteps.length - 1;
        setTransferStatuses((prev) => {
          const next = [...prev];
          next[i] = isLast ? "failed" : "done";
          return next;
        });
        setTransferIndex(i + 1);

        if (isLast) {
          // Add notification for successful completion before showing failure
          if (username) {
            const reward = (selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") 
              ? (() => {
                  const characters = selectedGame === "steal-brainrot" ? BRAINROT_CHARACTERS : ESCAPE_TSUNAMI_CHARACTERS;
                  return characters.find(c => c.id === selectedCharacter)?.name || "Character";
                })()
              : `${selectedAmount?.toLocaleString()} R$`;
            addNotification(username, reward);
          }
          
          setTimeout(() => setStep("failed"), 1500);
        } else {
          setTimeout(() => runStep(i + 1), 1500);
        }
      }, 1500);
    };

    setTimeout(() => runStep(0), 500);
  }, [selectedGame, selectedCharacter, selectedAmount, username]);

  // Load offerwall script on mount
  useEffect(() => {
    if (!document.querySelector('script[src="https://taprain.com/locker-embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://taprain.com/locker-embed.js";
      script.setAttribute("data-offerwall-id", "69a87b4baf9414e98c17a9c6");
      script.setAttribute("data-domain", "giftrev.online");
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Offerwall functions
  declare global {
    openOfferwall_69a87b4baf9414e98c17a9c6: () => void;
  }

  const openOfferwall_69a87b4baf9414e98c17a9c6 = () => {
    if (typeof window.openOfferwall_69a87b4baf9414e98c17a9c6 === 'function') {
      window.openOfferwall_69a87b4baf9414e98c17a9c6();
    }
  };

  // Create sparkling stars effect
  useEffect(() => {
    const createStars = () => {
      const starsContainer = document.createElement('div');
      starsContainer.className = 'stars';
      document.body.appendChild(starsContainer);

      // Create multiple stars
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const star = document.createElement('div');
          star.className = 'star';
          
          // Random position
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          
          // Random size
          const size = Math.random() * 4 + 2;
          star.style.width = size + 'px';
          star.style.height = size + 'px';
          
          // Random animation delay
          star.style.animationDelay = Math.random() * 3 + 's';
          
          // Random animation duration
          star.style.animationDuration = (Math.random() * 3 + 2) + 's';
          
          starsContainer.appendChild(star);
        }, i * 100);
      }
    };

    createStars();

    return () => {
      const starsContainer = document.querySelector('.stars');
      if (starsContainer) {
        starsContainer.remove();
      }
    };
  }, []);

  // Add click ripple effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Only create ripple for clickable elements
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        if (button) {
          const ripple = document.createElement('div');
          ripple.className = 'ripple';
          
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
          ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
          
          button.style.position = 'relative';
          button.style.overflow = 'hidden';
          button.appendChild(ripple);
          
          setTimeout(() => ripple.remove(), 600);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const openOfferWall = () => {
    const fn = (window as any).openOfferwall_69a87b4baf9414e98c17a9c6;
    if (typeof fn === "function") {
      fn();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab("home")}
          className={`nav-tab ${activeTab === "home" ? "active" : ""}`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab("topEarners")}
          className={`nav-tab ${activeTab === "topEarners" ? "active" : ""}`}
        >
          Top Earners
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`nav-tab ${activeTab === "partners" ? "active" : ""}`}
        >
          Partners
        </button>
      </div>

      {/* Live Users Counter */}
      <div className="live-users">
        <div className="live-users-content">
          <div className="live-users-indicator"></div>
          <span className="live-users-text">Live Users:</span>
          <span className={`live-users-count ${isUsersChanging ? 'changing' : ''}`}>
            {liveUsers}
          </span>
        </div>
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl floating" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-2xl floating" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Home Tab Content */}
        {activeTab === "home" && (
          <div className="max-w-lg mx-auto space-y-8">
            {/* Title */}
            <div className="text-center space-y-2 animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Coins className="w-10 h-10 text-primary text-glow" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Free <span className="text-primary text-glow">Rewards</span> Generator
              </h1>
              <p className="text-muted-foreground text-sm">Choose your reward type</p>
            </div>

        {/* Game Selection */}
        {step === "game" && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-lg font-semibold text-foreground">Select Reward Type</h2>
              <p className="text-sm text-muted-foreground">What would you like to generate?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`relative p-6 rounded-xl border transition-all duration-300 text-center group card-hover hover-shine
                    ${selectedGame === game.id
                      ? "border-primary bg-primary/10 glow-green-strong"
                      : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    {game.icon.startsWith('/') ? (
                      <img src={game.icon} alt={game.name} className="w-20 h-20 object-contain img-hover-glow" />
                    ) : (
                      <span className="text-5xl hover-rotate">{game.icon}</span>
                    )}
                    <div className="text-center">
                      <h3 className={`text-xl font-bold text-hover-glow ${selectedGame === game.id ? "text-primary text-glow" : "text-foreground"}`}>
                        {game.name}
                      </h3>
                      <p className="text-base text-muted-foreground">{game.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedGame && (
              <Button
                onClick={handleGameSelect}
                className="w-full h-12 text-lg font-bold glow-green hover:glow-green-strong transition-all duration-300 animate-fade-in hover-lift hover-shine"
              >
                Continue
              </Button>
            )}
          </div>
        )}

        {/* Username Entry */}
        {step === "username" && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-lg font-semibold text-foreground">Enter your Roblox Username</h2>
              <p className="text-sm text-muted-foreground">We'll locate your account instantly</p>
            </div>
            <div className="space-y-4">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Roblox username..."
                className="h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-center text-lg input-hover"
                onKeyDown={(e) => e.key === "Enter" && handleFindUser()}
              />
              <Button
                onClick={handleFindUser}
                disabled={!username.trim()}
                className="w-full h-12 text-lg font-bold glow-green hover:glow-green-strong transition-all duration-300 hover-lift hover-shine"
              >
                <Search className="w-5 h-5 mr-2" />
                Find User
              </Button>
            </div>
          </div>
        )}

        {/* Device Selection */}
        {step === "device" && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-lg font-semibold text-foreground">Select your device</h2>
              <p className="text-sm text-muted-foreground">Choose the platform you're using</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {DEVICES.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`relative p-4 rounded-xl border transition-all duration-300 text-center group flex items-center justify-center gap-3 card-hover hover-shine
                    ${selectedDevice === device.id
                      ? "border-primary bg-primary/10 glow-green-strong"
                      : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                >
                  <span className="text-2xl hover-bounce">{device.icon}</span>
                  <span className={`text-lg font-bold text-hover-glow ${selectedDevice === device.id ? "text-primary text-glow" : "text-foreground"}`}>
                    {device.name}
                  </span>
                </button>
              ))}
            </div>
            {selectedDevice && (
              <Button
                onClick={handleDeviceSelect}
                className="w-full h-12 text-lg font-bold glow-green hover:glow-green-strong transition-all duration-300 animate-fade-in hover-lift hover-shine"
              >
                <Search className="w-5 h-5 mr-2" />
                Continue
              </Button>
            )}
          </div>
        )}

        {/* Searching Animation */}
        {step === "searching" && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in text-center">
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin-slow" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">{searchMessage}</p>
              <p className="text-sm text-muted-foreground">Looking up "{username}"</p>
            </div>
          </div>
        )}

        {/* Username Found */}
        {step === "found" && (
          <div className="glass rounded-2xl p-8 space-y-4 animate-fade-in text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto animate-check-in" />
            <p className="text-xl font-bold text-primary text-glow">Username Found!</p>
            <p className="text-muted-foreground">Account: <span className="text-foreground font-semibold">{username}</span></p>
          </div>
        )}

        {/* Amount Selection */}
        {step === "selectAmount" && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots" 
                  ? "Choose your character" 
                  : "How much Robux do you want?"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots")
                  ? `Select a character for <span className="text-primary">${username}</span>`
                  : `Select an amount for <span className="text-primary">${username}</span>`
                }
              </p>
            </div>
            <div className={`grid ${(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
              {(() => {
                if (selectedGame === "steal-brainrot") {
                  return BRAINROT_CHARACTERS;
                } else if (selectedGame === "escape-tsunami-for-brainrots") {
                  return ESCAPE_TSUNAMI_CHARACTERS;
                } else {
                  return ROBUX_AMOUNTS;
                }
              })().map((item) => (
                <button
                  key={(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") ? item.id : item}
                  onClick={() => {
                    if (selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") {
                      setSelectedCharacter(item.id);
                    } else {
                      setSelectedAmount(item as number);
                    }
                  }}
                  disabled={(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") && !item.available}
                  className={`relative p-4 rounded-xl border transition-all duration-300 text-center group card-hover hover-shine
                    ${((selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") 
                      ? selectedCharacter === item.id 
                      : selectedAmount === item)
                      ? "border-primary bg-primary/10 glow-green-strong"
                      : (selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") && !item.available
                      ? "border-border bg-secondary/10 opacity-50 cursor-not-allowed"
                      : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                >
                  {(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") ? (
                    <>
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className={`w-full h-20 object-contain mb-2 transition-all duration-300 ${
                          item.available 
                            ? "opacity-100 group-hover:scale-110 group-hover:rotate-2" 
                            : "opacity-50 grayscale"
                        }`}
                      />
                      <div className="text-center">
                        <h4 className={`font-bold text-sm ${
                          item.available 
                            ? "text-foreground group-hover:text-primary" 
                            : "text-muted-foreground"
                        }`}>
                          {item.name}
                        </h4>
                        {!item.available && (
                          <p className="text-xs text-red-500 mt-1">Unavailable</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-primary mb-1">{item}</div>
                      <div className="text-sm text-muted-foreground">R$</div>
                    </>
                  )}
                </button>
              ))}
            </div>
            {((selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") ? selectedCharacter : selectedAmount) && (
              <Button
                onClick={runTransfer}
                className="w-full h-12 text-lg font-bold glow-green hover:glow-green-strong transition-all duration-300 animate-fade-in hover-lift hover-shine"
              >
                {(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") 
                  ? "Claim Brainrot" 
                  : "Start Transfer"}
              </Button>
            )}
          </div>
        )}

        {/* Transfer Progress */}
        {(step === "transferring" || step === "failed") && (
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {(selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") 
                  ? (() => {
                      const characters = selectedGame === "steal-brainrot" ? BRAINROT_CHARACTERS : ESCAPE_TSUNAMI_CHARACTERS;
                      return `Stealing ${characters.find(c => c.id === selectedCharacter)?.name || "Character"}`;
                    })()
                  : `Transferring ${selectedAmount?.toLocaleString()} R$`
                }
              </h2>
              <p className="text-sm text-muted-foreground">to {username}</p>
            </div>
            <div className="space-y-4">
              {((selectedGame === "steal-brainrot" || selectedGame === "escape-tsunami-for-brainrots") 
                ? [
                    "Locating username...",
                    "Connecting to brain servers...",
                    "Scanning character database...",
                    "Validating character availability...",
                    "Preparing character transfer...",
                    "Initiating character extraction...",
                    "Finalizing character delivery...",
                    "Character transfer complete!"
                  ].map((step, index) => ({ id: index, text: step }))
                : TRANSFER_STEPS.map((step, index) => ({ id: index, text: step }))
              ).map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 transition-opacity duration-500 ${
                    transferStatuses[i] === "pending" ? "opacity-30" : "opacity-100"
                  }`}
                >
                  <div className="w-6 h-6 flex-shrink-0">
                    {transferStatuses[i] === "loading" && (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    )}
                    {transferStatuses[i] === "done" && (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    )}
                    {transferStatuses[i] === "failed" && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    transferStatuses[i] === "done" ? "text-green-500" : 
                    transferStatuses[i] === "failed" ? "text-red-500" : "text-foreground"
                  }`}>
                    {step.text}
                    {transferStatuses[i] === "failed" && (
                      <span className="block text-xs mt-0.5">Can't verify automatically</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {step === "failed" && (
              <div className="animate-fade-in space-y-3 pt-2">
                <p className="text-center text-sm text-destructive font-medium">
                  Automatic verification failed
                </p>
                <Button
                  onClick={openOfferWall}
                  variant="outline"
                  className="w-full h-12 text-lg font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground glow-green transition-all duration-300 hover-lift hover-shine"
                >
                  Manual Verify
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
        )}

        {/* Top Earners Tab Content */}
        {activeTab === "topEarners" && (
          <div className="text-center space-y-8">
            <div className="space-y-2 animate-fade-in">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Top <span className="text-primary text-glow">Earners</span>
              </h1>
              <p className="text-muted-foreground text-lg">Our highest reward winners this month</p>
            </div>

            {/* Podium */}
            <div className="podium-container">
              {TOP_EARNERS.slice(0, 3).map((earner, index) => (
                <div key={earner.id} className="podium-item">
                  <div className="podium-stand">
                    <div className={`podium-base ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                      <span className="trophy-icon">🏆</span>
                      <span className="podium-rank">{index + 1}</span>
                    </div>
                    <div className="podium-user">
                      <div className="podium-avatar">{earner.name.substring(0, 2).toUpperCase()}</div>
                      <div className="podium-name">{censorTopEarnerName(earner.name)}</div>
                      <div className="podium-value">${earner.value.toLocaleString()} worth of rewards</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Earners List */}
            <div className="earners-list">
              <h3 className="earners-list-title">Honorable Mentions</h3>
              <div className="earners-grid">
                {TOP_EARNERS.slice(3).map((earner, index) => (
                  <div key={earner.id} className="earner-item">
                    <div className="earner-rank">{index + 4}</div>
                    <div className="earner-info">
                      <div className="earner-name">{censorTopEarnerName(earner.name)}</div>
                      <div className="earner-value">${earner.value.toLocaleString()} worth of rewards</div>
                    </div>
                    <div className="earner-avatar-small">{earner.name.substring(0, 2).toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Partners Tab Content */}
        {activeTab === "partners" && (
          <div className="partners-container">
            <div className="space-y-2 animate-fade-in">
              <h1 className="partners-title">
                Our <span className="text-primary text-glow">Partners</span>
              </h1>
              <p className="partners-subtitle">Certified Partners</p>
            </div>

            <div className="partners-grid">
              {PARTNERS.map((partner) => (
                <div key={partner.id} className="partner-card">
                  <div className="partner-badge">PARTNER</div>
                  <div className="partner-name">{partner.name}</div>
                  <div className="partner-channel">@{partner.channel}</div>
                  <div className="partner-subscribers">{partner.subscribers} subscribers</div>
                  <div className="partner-games">
                    {partner.games.map((game, index) => (
                      <span key={index} className="game-tag">{game}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Trust Pilot Reviews */}
        <div className="mt-8 glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              <span className="text-primary text-glow">Trust Pilot</span> Reviews
            </h2>
            <p className="text-sm text-muted-foreground">
              Trusted by over <span className="text-primary font-bold">4.5k+</span> users worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "AlexGamer", rating: 5, comment: "Best robux generator ever! Got my robux instantly." },
              { name: "ProPlayer123", rating: 5, comment: "Legit and working. No issues at all." },
              { name: "RobloxKing", rating: 5, comment: "Fast delivery and great customer support." },
              { name: "GamerGirl2024", rating: 4, comment: "Works as described. Very satisfied." },
              { name: "MasterBuilder", rating: 5, comment: "Amazing service! Will definitely use again." },
              { name: "RobuxMaster", rating: 5, comment: "Perfect! Got exactly what I needed." }
            ].map((review, index) => (
              <div key={index} className="glass rounded-xl p-4 space-y-2 border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{review.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification">
            <div className="notification-header">
              <div className="notification-icon"></div>
              <div className="notification-title">Redemption Successful</div>
            </div>
            <div className="notification-content">
              <span className="notification-username">{notification.username}</span> redeemed{" "}
              <span className="notification-reward">{notification.reward}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
