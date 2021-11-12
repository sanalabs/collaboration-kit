import { motion, MotionProps } from 'framer-motion'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { appSlice, selectReactionState } from './store'

const animationDuration = 1000 //ms

const EmojiContainer: React.FC<MotionProps> = ({ children, ...props }) => {
  const style = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  } as const
  return (
    <motion.div style={style} {...props}>
      {children}
    </motion.div>
  )
}

type Animation = { timestamp: number; id: string; x: number; y: number }
export const EmojiAnimation: React.FC<{ count: number; emoji: string }> = ({ count, emoji }) => {
  const [localCount, setLocalCount] = useState(count)
  const [animations, setAnimations] = useState<Animation[]>([])

  useEffect(() => {
    if (localCount === count) return

    setAnimations(previousAnimations => {
      // New animations since the last update
      const now = Date.now()
      const newAnimations = _.range(localCount, count).map(() => ({
        timestamp: now,
        id: `${emoji}-${count}`,
        x: -(Math.random() * 50 + 100),
        y: -(Math.random() * 50 + 100),
      }))

      // Remove old animations
      const prunedAnimations = previousAnimations.filter(
        ({ timestamp }) => now - timestamp < animationDuration,
      )

      // Take the 10 most recent animations
      return _.takeRight([...prunedAnimations, ...newAnimations], 10)
    })

    setLocalCount(count)
  }, [emoji, localCount, count, setLocalCount, setAnimations])

  return (
    <>
      {animations.map(({ id, x, y }) => (
        <EmojiContainer
          key={id}
          animate={{ x, y, opacity: 0 }}
          transition={{ duration: animationDuration / 1000 }}
        >
          {emoji}
        </EmojiContainer>
      ))}
    </>
  )
}

const ReactionButtonContainer: React.FC = ({ children }) => {
  const style = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as const
  return <div style={style}>{children}</div>
}

const StyledReactionButton: React.FC<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> = ({ children, ...props }) => {
  const style = {
    backgroundColor: 'transparent',
    fontSize: '40px',
    position: 'relative',
    cursor: 'pointer',
    border: 'none',
  } as const
  return (
    <button style={style} {...props}>
      {children}
    </button>
  )
}

const ReactionButton: React.FC<{ reaction: string; clientId: number }> = ({ reaction, clientId }) => {
  const state = useSelector(selectReactionState)[reaction] ?? {}
  const count = _.sum(Object.values(state).map(it => it.count))
  const dispatch = useDispatch()
  return (
    <ReactionButtonContainer>
      <StyledReactionButton
        onClick={() => dispatch(appSlice.actions.addReaction({ reaction: reaction, clientId: clientId }))}
      >
        {reaction}
        <EmojiAnimation emoji={reaction} count={count} />
      </StyledReactionButton>
    </ReactionButtonContainer>
  )
}

const DemoContainer: React.FC = ({ children }) => {
  const style = {
    position: 'fixed',
    height: 'fit-content',
    width: 'fit-content',
    display: 'flex',
    gap: '16px',
    margin: '16px',
    bottom: 128,
    right: 0,
  } as const
  return <div style={style}>{children}</div>
}

export const ReactionsDemo: React.FC<{ clientId: number }> = ({ clientId }) => {
  return (
    <DemoContainer>
      <ReactionButton reaction='️😎' clientId={clientId} />
      <ReactionButton reaction='😍' clientId={clientId} />
      <ReactionButton reaction='😂' clientId={clientId} />
    </DemoContainer>
  )
}
