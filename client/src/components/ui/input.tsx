import * as React from "react"

import { cn } from "@/lib/utils"
interface InputProps extends React.ComponentProps<"input"> {
  tooltip?: string
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, tooltip, ...props }, ref) => {
    // h-9 to match icon buttons and default buttons.
    return (
      <div className="group relative inline-block w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          onWheel={(e) => {
            // Prevent scroll from changing number input values
            if (type === 'number') {
              e.currentTarget.blur();
              e.stopPropagation();
            }
          }}
          {...props}
        />
        {
          //         tooltip && (
          //           // <div id="tooltip-bottom" role="tooltip" className={cn("absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-dark rounded-base shadow-xs opacity-0 tooltip")}>
          //           //   Tooltip on bottom
          //           //   <div className={cn("tooltip-arrow")} data-popper-arrow></div>
          //           <div className="relative group inline-block -bottom-8">
          //             {/* <button className="px-4 py-2 bg-blue-600 text-white rounded">
          //               Hover me
          //             </button> */}

          //             <div className="
          //   absolute left-1/2  -top-10
          //   px-3 py-1 text-sm text-white bg-gray-900 rounded
          //   opacity-0 group-hover:opacity-100 
          //   transition-opacity
          //   pointer-events-none
          //   whitespace-nowrap
          // ">
          //               {tooltip}
          //               <span className="
          //     absolute left-1/2 -top-2 
          //     border-8 border-transparent border-t-gray-900
          //   "></span>
          //             </div>
          //           </div>

          //           // <div className={cn("absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded-md py-1.5 px-2 shadow-lg z-50 whitespace-nowrap bottom-full mb-2 left-0 ml-1 transition-all duration-200 pointer-events-none   ")}>
          //           //   {tooltip}
          //           //   <div className={cn("absolute bottom-[-4px] left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900")}></div>
          //           // </div>
          //         )
        }
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
