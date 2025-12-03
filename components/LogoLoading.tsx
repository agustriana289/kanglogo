// components/LogoLoading.tsx
import React from "react";

interface LogoLoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LogoLoading: React.FC<LogoLoadingProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]}`}>
        <svg
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          viewBox="0 0 1080 1080"
          style={{ enableBackground: "new 0 0 1080 1080" }}
          xmlSpace="preserve"
        >
          <style type="text/css">
            {`
              .st0{fill:#FFFFFF;}
              .st1{fill:#4356ED;}
              .st2{fill:#3750E2;}
              .st3{fill:#4757F1;}
              .st4{fill:#FDD350;}
              .st5{fill:#F1F2F2;}
              
              /* Animasi slide up dari bawah ke atas */
              @keyframes slideUp {
                0% {
                  opacity: 0;
                  transform: translateY(30px);
                }
                50% {
                  opacity: 1;
                  transform: translateY(0);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              /* Bagian 1 - Kuning (Bawah) - Muncul pertama */
              .part-1 {
                animation: slideUp 1.5s ease-out infinite;
                animation-delay: 0s;
              }
              
              /* Bagian 2 - Biru Utama (Tengah) - Muncul kedua */
              .part-2 {
                animation: slideUp 1.5s ease-out infinite;
                animation-delay: 0.3s;
              }
              
              /* Bagian 3 - Ungu (Atas) - Muncul ketiga */
              .part-3 {
                animation: slideUp 1.5s ease-out infinite;
                animation-delay: 0.6s;
              }
            `}
          </style>
          <g>
            {/* Bagian 1 - Kuning Kiri Atas (muncul pertama) */}
            <g className="part-1">
              <path
                className="st4"
                d="M247.73,199.59L112.58,64.44c-21.47-21.47-58.19-6.26-58.19,24.1v334.57c0,30.37,36.72,45.58,58.19,24.1
                l135.15-135.15C278.79,281.01,278.79,230.65,247.73,199.59z"
              />
            </g>

            {/* Bagian 2 - Biru Utama (muncul kedua) */}
            <g className="part-2">
              <path
                className="st1"
                d="M1025.61,82.81v211.35c0,17.39-6.91,34.07-19.21,46.37L673.47,673.47l-266.6,266.62l-66.33,66.31
                c-12.3,12.3-28.98,19.2-46.37,19.2H82.81c-15.52,0-28.11-12.58-28.11-28.1V786.15c0-17.4,6.91-34.08,19.21-46.38l66.32-66.31
                l266.6-266.62L739.78,73.92c12.3-12.3,28.98-19.21,46.37-19.21H997.5C1013.03,54.71,1025.61,67.29,1025.61,82.81z"
              />
              <path
                className="st2"
                d="M934,167.6c14.16-14.16,22.12-33.37,22.12-53.4V54.71H785.83c-17.39,0-34.07,6.91-46.37,19.21L406.53,406.85
                l-266.6,266.62L73.6,739.78c-12.3,12.3-19.21,28.98-19.21,46.38v170.28h59.5c20.02,0,39.23-7.95,53.39-22.11l76.37-76.36
                l306.99-307.01L934,167.6z"
              />
            </g>

            {/* Bagian 3 - Ungu Kanan Bawah (muncul ketiga) */}
            <g className="part-3">
              <g>
                <path
                  className="st3"
                  d="M1015.56,967.42L880.41,832.27c-31.06-31.06-81.42-31.06-112.48,0L632.78,967.42
                  c-21.47,21.47-6.26,58.19,24.1,58.19h334.57C1021.82,1025.61,1037.03,988.89,1015.56,967.42z"
                />
                <path
                  className="st2"
                  d="M880.41,832.27c-31.06-31.06-81.42-31.06-112.48,0L632.78,967.42c-21.47,21.47-6.26,58.19,24.1,58.19h79.54
                  L849.74,912.3c27.67-27.67,70.66-30.67,101.67-9.03L880.41,832.27z"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default LogoLoading;
